import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';
import { Validators } from '/imports/api/validators/validators.js';
import { LCD } from '../../../../server/main';

const fetchFromUrl = (url) => {
  try {
    const res = HTTP.get(LCD + url);
    if (res.statusCode === 200) {
      return res;
    }
  } catch (e) {
    console.log(`URl fail: ${LCD + url}`);
    console.log(e);
  }
  return null;
};

Meteor.methods({
  'accounts.getAccountDetail'(address) {
    this.unblock();
    const url = `${LCD}/auth/accounts/${address}`;
    try {
      const available = HTTP.get(url);
      if (available.statusCode === 200) {
        const response = JSON.parse(available.content).result;
        let account;
        if (response.type === 'cosmos-sdk/Account') {
          account = response.value;
        } else if (response.type === 'cosmos-sdk/DelayedVestingAccount'
            || response.type === 'cosmos-sdk/ContinuousVestingAccount') {
          account = response.value.BaseVestingAccount.BaseAccount;
        }
        if (account && account.account_number != null) { return account; }
        return null;
      }
    } catch (e) {
      console.log(e);
    }
  },
  'accounts.getBalance'(address) {
    this.unblock();
    const balance = {};

    // get available atoms
    let url = `${LCD}/bank/balances/${address}`;
    try {
      const available = HTTP.get(url);
      if (available.statusCode === 200) {
        balance.available = JSON.parse(available.content).result;
      }
    } catch (e) {
      console.log(e);
    }

    // get delegated amnounts
    url = `${LCD}/staking/delegators/${address}/delegations`;
    try {
      const delegations = HTTP.get(url);
      if (delegations.statusCode === 200) {
        balance.delegations = JSON.parse(delegations.content).result;
      }
    } catch (e) {
      console.log(e);
    }
    // get unbonding
    url = `${LCD}/staking/delegators/${address}/unbonding_delegations`;
    try {
      const unbonding = HTTP.get(url);
      if (unbonding.statusCode === 200) {
        balance.unbonding = JSON.parse(unbonding.content).result;
      }
    } catch (e) {
      console.log(e);
    }

    // get rewards
    url = `${LCD}/distribution/delegators/${address}/rewards`;
    try {
      const rewards = HTTP.get(url);
      if (rewards.statusCode === 200) {
        // get seperate rewards value
        balance.rewards = JSON.parse(rewards.content).result.rewards;
        // get total rewards value
        balance.total_rewards = JSON.parse(rewards.content).result.total;
      }
    } catch (e) {
      console.log(e);
    }

    // get commission
    const validator = Validators.findOne(
      { $or: [{ operator_address: address }, { delegator_address: address }, { address }] },
    );
    if (validator) {
      url = `${LCD}/distribution/validators/${validator.operator_address}`;
      balance.operator_address = validator.operator_address;
      try {
        const rewards = HTTP.get(url);
        if (rewards.statusCode === 200) {
          const content = JSON.parse(rewards.content).result;
          if (content.val_commission && content.val_commission.length > 0) {
            balance.commission = content.val_commission;
          }
        }
      } catch (e) {
        console.log(e);
      }
    }

    return balance;
  },
  'accounts.getDelegation'(address, validator) {
    let url = `/staking/delegators/${address}/delegations/${validator}`;
    let delegations = fetchFromUrl(url);
    if (delegations === null) {
      return undefined;
    }
    delegations = delegations.data.result;
    if (delegations.shares) {
      delegations.shares = parseFloat(delegations.shares);
    }

    url = `/staking/redelegations?delegator=${address}&validator_to=${validator}`;
    let relegations = fetchFromUrl(url);
    relegations = relegations && relegations.data.result;
    let completionTime;
    if (relegations) {
      relegations.forEach((relegation) => {
        const { entries } = relegation;
        const time = new Date(entries[entries.length - 1].completion_time);
        if (!completionTime || time > completionTime) { completionTime = time; }
      });
      delegations.redelegationCompletionTime = completionTime;
    }

    url = `/staking/delegators/${address}/unbonding_delegations/${validator}`;
    let undelegations = fetchFromUrl(url);
    undelegations = undelegations && undelegations.data.result;
    if (undelegations) {
      delegations.unbonding = undelegations.entries.length;
      delegations.unbondingCompletionTime = undelegations.entries[0].completion_time;
    }
    return delegations;
  },
  'accounts.getAllDelegations'(address) {
    const url = `${LCD}/staking/delegators/${address}/delegations`;

    try {
      let delegations = HTTP.get(url);
      if (delegations.statusCode === 200) {
        delegations = JSON.parse(delegations.content).result;
        if (delegations && delegations.length > 0) {
          delegations.forEach((delegation, i) => {
            if (delegations[i] && delegations[i].shares) { delegations[i].shares = parseFloat(delegations[i].shares); }
          });
        }

        return delegations;
      }
    } catch (e) {
      console.log(e);
    }
  },
  'accounts.getAllUnbondings'(address) {
    const url = `${LCD}/staking/delegators/${address}/unbonding_delegations`;

    try {
      let unbondings = HTTP.get(url);
      if (unbondings.statusCode === 200) {
        unbondings = JSON.parse(unbondings.content).result;
        return unbondings;
      }
    } catch (e) {
      console.log(e);
    }
  },
  'accounts.getAllRedelegations'(address, validator) {
    const url = `/staking/redelegations?delegator=${address}&validator_from=${validator}`;
    const result = fetchFromUrl(url);
    if (result && result.data) {
      const redelegations = {};
      result.data.forEach((redelegation) => {
        const { entries } = redelegation;
        redelegations[redelegation.validator_dst_address] = {
          count: entries.length,
          completionTime: entries[0].completion_time,
        };
      });
      return redelegations;
    }
  },


});

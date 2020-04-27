import React, { Component } from 'react';
import { Badge } from 'reactstrap';
import numbro from 'numbro';

const errors = {
  sdk: {
    1: 'Internal Error',
    2: 'Tx Decode Error',
    3: 'Invalid Sequence Number',
    4: 'Unauthorized',
    5: 'Insufficient Funds',
    6: 'Unknown Request',
    7: 'Invalid Address',
    8: 'Invalid PubKey',
    9: 'Unknown Address',
    10: 'Insufficient Coins',
    11: 'Invalid Coins',
    12: 'Out Of Gas',
    13: 'Memo Too Large',
    14: 'Insufficient Fee',
    15: 'Too Many Signatures',
    16: 'Gas Overflow',
    17: 'No Signatures',
  },
  staking: {
    101: 'Invalid Validator',
    102: 'Invalid Delegation',
    103: 'Invalid Input',
    104: 'Validator Jailed',
  },
  gov: {
    1: 'Unknown Proposal',
    2: 'Inactive Proposal',
    3: 'Already Active Proposal',
    4: 'Already Finished Proposal',
    5: 'Address Not Staked',
    6: 'Invalid Title',
    7: 'Invalid Description',
    8: 'Invalid Proposal Type',
    9: 'Invalid Vote',
    10: 'Invalid Genesis',
    11: 'Invalid Proposal Status',
  },
  distr: {
    103: 'Invalid Input',
    104: 'No Distribution Info',
    105: 'No Validator Commission',
    106: 'Set Withdraw Addrress Disabled',
  },
  bank: {
    101: 'Send Disabled',
    102: 'Invalid Inputs Outputs',
  },
  slashing: {
    101: 'Invalid Validator',
    102: 'Validator Jailed',
    103: 'Validator Not Jailed',
    104: 'Missing Self Delegation',
    105: 'Self Delegation Too Low',
  },
};

export default class CosmosErrors extends Component {
  constructor(props) {
    super(props);
    this.state = {
      error: errors.sdk[1],
      message: '',
    };
    // console.log(`logs: ${JSON.stringify(props.logs)}`)
    if (props.logs.raw_log) {
      let error = {};
      try {
        error.code = props.code;
        error.message = props.logs.raw_log;
      } catch (e) {
        // debug(e);
        error = {
          code: 1,
          message: 'Unknown error',
        };
      }
      this.state = {
        error: (error.codespace && error.code && errors[error.codespace] && errors[error.codespace][error.code]) || 'Unknown error',
        message: error.message || '',
      };
    } else if (props.code === 12) {
      this.state = {
        error: errors.sdk[12],
        message: `gas uses (${numbro(props.gasUses).format('0,0')}) > gas wanted (${numbro(props.gasWanted).format('0,0')})`,
      };
    }
  }

  render() {
    return (
      <div>
        {this.state.error}
        :
        {' '}
        <Badge color="dark">
          {this.state.message}
        </Badge>
      </div>
    );
  }
}

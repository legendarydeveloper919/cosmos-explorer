import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import {
  Card, CardBody, CardSubtitle, Col, Progress, Row, Spinner,
} from 'reactstrap';
import moment from 'moment';
import numbro from 'numbro';
import i18n from 'meteor/universe:i18n';
import CountDown from '../components/CountDown.jsx';
import Avatar from '../components/Avatar.jsx';

const T = i18n.createComponent();
export default class Consensus extends Component {
  constructor(props) {
    super(props);
    this.state = {
      chainStopped: false,
    };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.consensus !== this.props.consensus) {
      if (this.props.consensus.latestBlockTime) {
        // console.log()
        const lastSync = moment(this.props.consensus.latestBlockTime);
        const current = moment();
        const diff = current.diff(lastSync);
        if (diff > 60000) {
          this.setState({
            chainStopped: true,
          });
        } else {
          this.setState({
            chainStopped: false,
          });
        }
      }
    }
  }

  render() {
    if (this.props.loading) {
      return <Spinner type="grow" color="primary" />;
    }

    if (this.props.consensusExist && this.props.consensus.prevotes) {
      const proposer = this.props.consensus.proposer();
      const moniker = (proposer && proposer.description && proposer.description.moniker) ? proposer.description.moniker : this.props.consensus.proposerAddress;
      const profileUrl = (proposer && proposer.profile_url) || '';
      return (
        <div>
          {(this.state.chainStopped) ? (
            <Card body inverse color="danger">
              <span>
                <T _purify={false} time={moment(this.props.consensus.latestBlockTime).fromNow(true)}>chainStatus.stopWarning</T>
              </span>
            </Card>
          ) : ''}
          <Card className="status consensus-state">
            <div className="card-header">
              <T>consensus.consensusState</T>
            </div>
            <CardBody>
              <Row>
                <Col md={8} lg={6}>
                  <Row>
                    <Col md={2}>
                      <Row>
                        <Col md={12} xs={4}>
                          <CardSubtitle>
                            <T>common.height</T>
                          </CardSubtitle>
                        </Col>
                        <Col md={12} xs={8}>
                          <span className="value">
                            {numbro(this.props.consensus.votingHeight).format('0,0')}
                          </span>
                        </Col>
                      </Row>
                    </Col>
                    <Col md={2}>
                      <Row>
                        <Col md={12} xs={4}>
                          <CardSubtitle>
                            <T>consensus.round</T>
                          </CardSubtitle>
                        </Col>
                        <Col md={12} xs={8}>
                          <span className="value">
                            {this.props.consensus.votingRound}
                          </span>
                        </Col>
                      </Row>
                    </Col>
                    <Col md={2}>
                      <Row>
                        <Col md={12} xs={4}>
                          <CardSubtitle>
                            <T>consensus.step</T>
                          </CardSubtitle>
                        </Col>
                        <Col md={12} xs={8}>
                          <span className="value">
                            {this.props.consensus.votingStep}
                          </span>
                        </Col>
                      </Row>
                    </Col>
                    <Col md={6}>
                      <Row>
                        <Col md={12} xs={4}>
                          <CardSubtitle>
                            <T>blocks.proposer</T>
                          </CardSubtitle>
                        </Col>
                        <Col md={12} xs={8}>
                          <span className="value">
                            <Link to={`/validator/${this.props.consensus.proposerAddress}`}>
                              <Avatar moniker={moniker} profileUrl={profileUrl} address={this.props.consensus.proposerAddress} list />
                              {moniker}
                            </Link>
                          </span>
                        </Col>
                      </Row>
                    </Col>
                  </Row>
                </Col>
                <Col md={4} lg={6}>
                  <CardSubtitle>
                    <T>common.votingPower</T>
                  </CardSubtitle>
                  <Progress animated value={this.props.consensus.votedPower} className="value">
                    {this.props.consensus.votedPower}
                    %
                  </Progress>
                </Col>
              </Row>
            </CardBody>
          </Card>
        </div>
      );
    }

    const genesisTime = moment(Meteor.settings.public.genesisTime);
    const current = moment();
    const diff = genesisTime.diff(current);

    return (
      <div className="text-center">
        <Card body inverse color="danger">
          <span>
            <T>chainStatus.startMessage</T>
          </span>
        </Card>
        <CountDown genesisTime={diff / 1000} />
      </div>
    );
  }
}

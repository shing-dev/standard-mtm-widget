/* eslint class-methods-use-this: off */
import { h } from 'preact';
import { connect } from 'react-redux';
import { route } from 'preact-router';
import classNames from 'classnames';

import {
  send, objectToUrlParams,
} from '../../helpers/utils';
import { gaResultsOnContinue, gaSuccess } from '../../helpers/ga';
import {
  BaseMobileFlow,
  Measurements,
  Guide,
  SoftValidation,
} from '../../components';
import actions from '../../store/actions';
import FlowService from '../../services/flowService';

import './Result.scss';
import successIcon from '../../images/ic_done.svg';

/**
 * Results page component.
 * Displays results of the flow.
 */
class Results extends BaseMobileFlow {
  constructor(props) {
    super(props);

    this.state = {
      openGuide: false,
      measurementsType: null,
      measurement: null,
    };

    const { flowId, token } = this.props;

    this.flow = new FlowService(token);
    this.flow.setFlowId(flowId);

    // the problem is that if we have soft validation screen
    // then at results screen we have size recommendations in componentDidMount
    // but if we dont have soft validation errors, then in componentDidMount
    // size recommendations will be equal null
    // to fix this we need to send patch request
    // only once (in componentDidMount or componentWillReceiveProps)
    // and because of that we need this flag to prevent double patch request
    this.isRecommendationsSent = false;
  }

  componentDidMount = async () => {
    await super.componentDidMount();

    const {
      measurements,
      mtmClientId,
      origin,
      setIsHeaderTranslucent,
      isMobile,
      setFlowIsPending,
      setProcessingStatus,
    } = this.props;

    setIsHeaderTranslucent(true);

    this.sendMeasurements(measurements, mtmClientId, origin);

    gaSuccess();

    if (!isMobile) {
      this.timer = setInterval(() => {
        this.flow.get()
          .then((flowState) => {
            if (flowState.state.status === 'finished') {
              return;
            }

            setFlowIsPending(true);
            setProcessingStatus('');

            route('/qrcode', true);
          })
          .catch((err) => console.log(err));
      }, 3000);
    }
  }

  componentWillReceiveProps = async (nextProps) => {
    const {
      measurements,
      mtmClientId,
      origin,
    } = nextProps;

    this.sendMeasurements(measurements, mtmClientId, origin);
  }

  componentWillUnmount() {
    const { setIsHeaderTranslucent } = this.props;

    setIsHeaderTranslucent(false);
  }

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  /**
   * Send size recommendations to flow api
   *
   * @param {Object} measurements - measurements object
   * @param {number} mtmClientId - mtm client id
   */
  sendMeasurements = async (measurements, mtmClientId, origin) => {
    await this.flow.updateState({
      status: 'finished',
      measurements,
      mtmClientId,
    });

    send('data', measurements, origin);
  }

  openGuide = (index, type) => {
    this.setState({
      openGuide: true,
      measurementsType: type,
      measurement: index,
    });
  }

  helpBtnToggle = (status) => {
    const { setHelpBtnStatus } = this.props;

    setHelpBtnStatus(status);
  }

  onRetake = async () => {
    const {
      addFrontImage,
      addSideImage,
      setTaskId,
    } = this.props;

    await this.flow.updateState({
      status: 'opened-on-mobile',
      processStatus: '',
    });

    setTaskId(null);
    addFrontImage(null);
    addSideImage(null);
    route('/upload', true);
  }

  onClick = async () => {
    const {
      returnUrl,
      isFromDesktopToMobile,
      origin,
      personId,
      resetState,
      measurements,
      isMobile,
      isOpenReturnUrlDesktop,
      setHelpBtnStatus,
      isSmbFlow,
    } = this.props;

    const { openGuide } = this.state;

    if (openGuide) {
      setHelpBtnStatus(true);

      this.setState({
        openGuide: false,
      });

      return;
    }

    gaResultsOnContinue();

    if (isFromDesktopToMobile) {
      // pass measurements via hash get params to the destination page
      window.location = `${returnUrl}#/?${objectToUrlParams({
        ...measurements,
        personId,
      })}`;
    }

    if (isMobile) {
      if (measurements && !isSmbFlow) {
        window.location = `${returnUrl}#/?${objectToUrlParams({
          ...measurements,
          personId,
        })}`;
      } else {
        window.location = returnUrl;
      }
    } else if (isOpenReturnUrlDesktop) {
      window.parent.location = returnUrl;
    } else {
      resetState();
      send('close', {}, origin);
    }
  }

  render() {
    const {
      measurements,
      settings,
      isSoftValidationPresent,
      softValidation,
      units,
      gender,
      isMobile,
    } = this.props;

    const { openGuide, measurementsType, measurement } = this.state;

    const results = settings.final_page;

    return (
      <div className="screen screen--result active">
        <div className={classNames('screen__content', 'result', {
          'result--with-soft-validation': isSoftValidationPresent,
        })}
        >
          {openGuide ? (
            <Guide gender={gender} measurementsType={measurementsType} measurement={measurement} />
          ) : null}

          <h2 className="screen__subtitle">
            <span className="success">
              Complete
            </span>
          </h2>

          {(results === 'measurements') ? (
            <h3 className="screen__title result__title">your Measurements</h3>
          ) : null}

          {(isSoftValidationPresent && !openGuide) ? (
            <SoftValidation
              className="result__soft-validation"
              retake={this.onRetake}
              units={units}
              gender={gender}
              softValidation={softValidation}
              isDesktop={!isMobile}
            />
          ) : null }

          {(results === 'measurements') ? (
            <Measurements
              measurements={measurements}
              units={units}
              openGuide={this.openGuide}
              helpBtnToggle={this.helpBtnToggle}
            />
          ) : null}

          {(results === 'thanks') ? (
            <div className="result__thanks">
              <figure className="result__thanks-icon">
                <img src={successIcon} alt="success" />
              </figure>
              <h3 className="result__thanks-title">Success! You're all set.</h3>
              <p className="result__thanks-text">
                We've got your measurements to
                <br />
                create your customized wardrobe
              </p>
            </div>
          ) : null}
        </div>
        <div className="screen__footer">
          <button className="button" type="button" onClick={this.onClick}>
            {openGuide ? 'BACK TO RESULTS' : 'CLOSE'}
          </button>
        </div>
      </div>
    );
  }
}

export default connect((state) => state, actions)(Results);

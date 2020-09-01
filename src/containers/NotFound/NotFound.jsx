import { h, Component } from 'preact';
import { route } from 'preact-router';
import { connect } from 'react-redux';

import actions from '../../store/actions';
import { gaSizeNotFound } from '../../helpers/ga';
import { mobileFlowStatusUpdate } from '../../helpers/utils';
import FlowService from '../../services/flowService';

import './NotFound.scss';
import confusedIcon1x from '../../images/confused.png';
import confusedIcon2x from '../../images/confused@2x.png';

/**
 * Size not found page component
 */
class NotFound extends Component {
  constructor(props) {
    super(props);

    const { setPageReloadStatus } = props;

    this.reloadListener = () => {
      setPageReloadStatus(true);
    };

    window.addEventListener('unload', this.reloadListener);
  }

  componentWillUnmount() {
    window.removeEventListener('unload', this.reloadListener);
  }

  componentDidMount = async () => {
    gaSizeNotFound();

    const {
      addFrontImage,
      addSideImage,
      token,
      flowId,
      pageReloadStatus,
      isFromDesktopToMobile,
      isNetwork,
      isDemoWidget,
    } = this.props;

    if (isNetwork) {
      addFrontImage(null);
      addSideImage(null);
    }

    this.flow = new FlowService(token);
    this.flow.setFlowId(flowId);
    this.flow.updateLocalState({ processStatus: '' });

    // PAGE RELOAD: update flowState and set lastActiveDate for desktop loader
    if ((pageReloadStatus && isFromDesktopToMobile) || (pageReloadStatus && isDemoWidget)) {
      const { flowState, setPageReloadStatus } = this.props;

      setPageReloadStatus(false);

      mobileFlowStatusUpdate(this.flow, flowState);
    }
  }

  close = () => {
    route('/upload');
  }

  render() {
    const { isNetwork } = this.props;
    const btnText = isNetwork ? 'ok' : 'try again';
    const text = isNetwork ? 'try little bit later.' : 'check your internet connection and try again.';

    return (
      <section className="screen active">
        <div className="screen__content not-found">
          <h2 className="screen__subtitle">
            <span className="failure">Error</span>
          </h2>

          <h3 className="screen__title not-found__title">Oops!</h3>
          <p className="not-found__text">
            Something went wrong
          </p>

          {isNetwork ? (
            <img className="not-found__image" src={confusedIcon1x} srcSet={`${confusedIcon1x} 1x, ${confusedIcon2x} 2x`} alt="not found" />
          ) : null}

          <p className="not-found__text-2">
            We can’t calculate your
            <b> measurements </b>
            right now.
            <br />
            {`Please ${text}`}
          </p>
        </div>
        <div className="screen__footer">
          <button className="button" onClick={this.close} type="button">{btnText}</button>
        </div>
      </section>
    );
  }
}

export default connect((state) => state, actions)(NotFound);

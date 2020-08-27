import { h } from 'preact';
import { connect } from 'react-redux';
import { route } from 'preact-router';

import actions from '../../store/actions';
import { gaSwitchToMobileFlow } from '../../helpers/ga';
import {
  browserValidation, isMobileDevice,
} from '../../helpers/utils';
import { BaseMobileFlow, Loader } from '../../components';

/**
 * Mobile flow page component
 */
class MobileFlow extends BaseMobileFlow {
  state = {
    hasActiveSubscription: true,
  };

  componentWillUnmount() {
    if (this.unsubscribe) this.unsubscribe();

    window.removeEventListener('online', this.pageReload);
  }

  componentDidMount = async () => {
    try {
      const {
        matches, flowState, setFlowState,
      } = this.props;

      window.addEventListener('online', this.pageReload);

      if (!isMobileDevice()) {
        route('/camera-mode-selection', true);

        return Promise.resolve();
      }

      await super.componentDidMount();

      if (!browserValidation()) {
        route('/browser', true);

        return Promise.resolve();
      }

      gaSwitchToMobileFlow();

      const flowStateData = await this.flow.get();

      if (flowStateData.state.status !== 'finished') {
        await this.flow.updateState({
          ...flowStateData.state,
          status: 'opened-on-mobile',
          processStatus: '',
        });

        // FOR PAGE RELOAD
        if (!flowState) {
          setFlowState({
            ...flowStateData.state,
            status: 'opened-on-mobile',
          });
        }

        setInterval(() => {
          this.flow.updateState({
            lastActiveDate: Date.now(),
          });
        }, 3000);

        route('/camera-mode-selection');
      }

      return Promise.resolve();
    } catch (err) {
      if (err.response.status === 401
        && err.response.data.detail === 'Widget is inactive.') {
        route('/results', true);

        return Promise.resolve();
      }

      if (err && err.response && err.response.data) {
        console.error(err.response.data.detail);
      } else {
        console.error(err.message);
      }

      this.setState({
        hasActiveSubscription: false,
      });

      return Promise.resolve();
    }
  }

  pageReload = () => {
    window.location.reload();
  }

  render() {
    const { hasActiveSubscription } = this.state;

    if (!hasActiveSubscription) {
      return (
        <div className="screen active">
          <div className="tutorial__desktop-msg">
            <h2>
              Sorry! Your measuring process cannot be completed right now.
              Please contact your brand representative.
            </h2>
          </div>
        </div>
      );
    }

    return (
      <Loader />
    );
  }
}

export default connect((state) => state, actions)(MobileFlow);

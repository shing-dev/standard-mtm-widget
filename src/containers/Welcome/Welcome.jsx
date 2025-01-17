import { h, Component, Fragment } from 'preact';
import { route } from 'preact-router';
import { connect } from 'react-redux';
import { detect } from 'detect-browser';

import {
  browserValidation,
  isMobileDevice,
  mobileFlowStatusUpdate,
  parseGetParams,
  parseReturnUrl,
} from '../../helpers/utils';
import { gaStart, gaWelcomeOnContinue } from '../../helpers/ga';
import actions from '../../store/actions';
import FlowService from '../../services/flowService';
import analyticsService, {
  WELCOME_SCREEN_ENTER,
  WELCOME_SCREEN_CLOSE,
} from '../../services/analyticsService';
import { Browser } from '..';
import { flowStatuses } from '../../configs/flowStatuses';

import './Welcome.scss';
import mobileBg from '../../images/img_mtm_mobile.png';
import desktopBg from '../../images/img_mtm.png';
import loader from '../../images/sms-sending.svg';

/**
 * Welcome page component
 */
class Welcome extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isButtonDisabled: false,
      invalidBrowser: false,
    };

    const { setPageReloadStatus } = props;

    this.reloadListener = () => {
      setPageReloadStatus(true);
    };

    window.addEventListener('unload', this.reloadListener);
  }

  componentDidMount() {
    const {
      isSmbFlow,
      setFlowId,
      setWidgetId,
      setBrand,
      setBodyPart,
      setProductUrl,
      setToken,
      setIsMobile,
      setOrigin,
      matches,
      setReturnUrl,
      setFakeSize,
      setIsOpenReturnUrlDesktop,
      setIsFromDesktopToMobile,
      setProductId,
      setWidgetUrl,
      resetState,
      setSettings,
      setIsPhotosFromGallery,
      isDemoWidget,
      token,
      setUnits,
      addHeight,
      setWeightLb,
      setWeight,
      setEmail,
      setCustomSettings,
      addGender,
      setMtmClientId,
      source,
      setIsDisabledEmail,
      setIsDisableEmailScreen,
    } = this.props;

    const parsedReturnUrl = parseReturnUrl(matches.returnUrl);

    const uuid = (matches || {}).key || API_KEY || parseGetParams().key;
    const brand = matches.brand || TEST_BRAND;
    const bodyPart = matches.body_part || TEST_BODY_PART;
    const photosFromGallery = matches.photosFromGallery || false;

    this.widgetContainer = document.querySelector('.widget-container');

    if (isMobileDevice() && !browserValidation()) {
      setIsMobile(true);
      setWidgetUrl(window.location.href);
      setReturnUrl(parsedReturnUrl);
      setToken(uuid);
      setIsFromDesktopToMobile(false);

      this.setState({
        invalidBrowser: true,
      });

      return;
    }

    this.widgetContainer.classList.remove('widget-container--no-bg');

    window.addEventListener('load', () => {
      this.setState({
        isButtonDisabled: true,
      });

      gaStart();

      if (photosFromGallery) {
        setIsPhotosFromGallery(true);
      }

      if (!isSmbFlow && !isDemoWidget) {
        resetState();

        setToken(uuid);
        setBrand(brand);
        setBodyPart(bodyPart);
        setProductUrl(matches.product);
        setOrigin(matches.origin);
        setIsMobile(isMobileDevice());
        setReturnUrl(parsedReturnUrl);
        setIsOpenReturnUrlDesktop(!!matches.returnUrlDesktop);
        setFakeSize(!!matches.fakeSize);
        setProductId(parseInt(matches.productId, 10));
        setMtmClientId(matches.mtmClientId);

        this.flow = new FlowService(uuid);
        this.flow.setFlowId(uuid);

        this.flow.get()
          .then(() => this.flow.update({
            source,
            mtm_client: matches.mtmClientId,
            state: {
              status: flowStatuses.CREATED,
              productUrl: matches.product,
              brand,
              bodyPart,
              returnUrl: parsedReturnUrl,
              fakeSize: !!matches.fakeSize,
              productId: parseInt(matches.productId, 10),
              ...(photosFromGallery && { photosFromGallery: true }),
            },
          }))
          .then((res) => {
            const { state } = res;
            const { gender } = res.widget_settings;

            setFlowId(res.uuid);
            setWidgetId(res.id);
            setSettings(res.settings);
            // save to store default values
            setUnits(state.units);
            addHeight(state.height);
            setEmail(state.email);
            setWeightLb(state.weightLb);
            setWeight(state.weight);
            setIsDisabledEmail(state.disabledEmail);
            setIsDisableEmailScreen(state.disableEmailScreen);

            setCustomSettings(res.widget_settings);

            if (gender !== 'all') {
              addGender(gender);
            }

            this.setState({
              isButtonDisabled: false,
            });
          })
          .catch((err) => {
            this.widgetIframe = window.parent.document.querySelector('.saia-mtm-drop iframe');

            // condition for preventing appearing the error alert in safari
            // after the widget closes quickly after it is opened
            if (this.widgetIframe.getAttribute('src') !== '') {
              alert(err.message);
            }
          });
      } else {
        const { pageReloadStatus, flowId } = this.props;

        this.flow = new FlowService(flowId);
        this.flow.setFlowId(flowId);

        // PAGE RELOAD: update flowState and set lastActiveDate for desktop loader
        if (pageReloadStatus && isDemoWidget) {
          const { setPageReloadStatus, flowState } = this.props;

          setPageReloadStatus(false);

          mobileFlowStatusUpdate(this.flow, flowState);
        }

        this.setState({
          isButtonDisabled: false,
        });
      }
    }, { once: true });

    analyticsService({
      uuid: uuid || token,
      event: WELCOME_SCREEN_ENTER,
      data: {
        device: isMobileDevice() ? 'mobile' : 'web browser',
        browser: detect().name === 'ios' ? 'safari' : detect().name,
      },
    });
  }

  /**
   * On next screen event handler
   */
  onNextScreen = async () => {
    gaWelcomeOnContinue();

    const {
      matches,
      token,
      customSettings,
      setIsSkipEmailScreen,
      isDisableEmailScreen,
      isSmbFlow,
      isSmbQRFlow,
      isDemoWidget,
    } = this.props;

    const isSkip = (isSmbFlow && !isSmbQRFlow)
      || isDemoWidget
      || isDisableEmailScreen;

    setIsSkipEmailScreen(isSkip);

    let routeUrl;

    if (isSkip) {
      routeUrl = customSettings.gender !== 'all' ? '/height' : 'gender';
    } else {
      routeUrl = '/email';
    }

    const widgetUUID = matches.key || API_KEY || parseGetParams().key;

    analyticsService({
      uuid: widgetUUID || token,
      event: WELCOME_SCREEN_CLOSE,
    });
    route(routeUrl, false);
  }

  componentWillUnmount() {
    this.widgetContainer.classList.add('widget-container--no-bg');
    window.removeEventListener('unload', this.reloadListener);
  }

  render() {
    const { isButtonDisabled, invalidBrowser } = this.state;

    return (
      <Fragment>
        { invalidBrowser ? (
          <Browser />
        ) : (
          <section className="screen active">
            <div className="screen__content welcome">
              <picture className="welcome__img">
                <source media="(max-width: 500px)" srcSet={mobileBg} />
                <img src={desktopBg} alt="photos_model_perfect-fit" />
              </picture>
              <div className="screen__intro">
                <h4 className="screen__intro-title">
                  体型を測定して、自分だけの
                  <br />
                  オーダーメイド枕を作ろう
                </h4>
                <p className="screen__intro-txt">
                  メジャー等は不要、わずか1分ほどでまくら作成に必要な測定を行います。
                </p>
              </div>
            </div>
            <div className="screen__footer">
              <button className="button" type="button" onClick={this.onNextScreen} disabled={isButtonDisabled}>
                <img
                  className="screen__footer-loader"
                  src={loader}
                  alt="loader"
                />
                <span>次へ</span>
              </button>
            </div>
          </section>
        )}
      </Fragment>
    );
  }
}

export default connect((state) => state, actions)(Welcome);

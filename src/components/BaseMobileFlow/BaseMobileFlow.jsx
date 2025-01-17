import { h, Component } from 'preact';

import FlowService from '../../services/flowService';
import { filterCustomMeasurements, isMobileDevice } from '../../helpers/utils';

/**
 * Mobile flow page component
 */
class BaseMobileFlow extends Component {
  componentWillUnmount() {
    if (this.unsubscribe) this.unsubscribe();
  }

  componentDidMount() {
    const {
      setFlowId,
      setBrand,
      setBodyPart,
      setProductUrl,
      setToken,
      setIsMobile,
      matches,
      addHeight,
      addGender,
      addFrontImage,
      addSideImage,
      setPersonId,
      setIsFromDesktopToMobile,
      setReturnUrl,
      setWidgetUrl,
      setMeasurements,
      setBodyType,
      setFakeSize,
      setEmail,
      setPhoneNumber,
      setProductId,
      setUnits,
      setWeight,
      setFlowState,
      flowState,
      setSettings,
      setMtmClientId,
      setFirstName,
      setNotes,
      resetState,
      setIsPhotosFromGallery,
      setWidgetId,
      isWidgetDeactivated,
      setCustomSettings,
    } = this.props;

    if (!isMobileDevice()) {
      setIsMobile(false);

      return;
    }

    const token = matches.id || API_KEY;

    if (!matches.id) { return; }

    setToken(token);

    this.flow = new FlowService(token);

    if (isWidgetDeactivated) {
      this.flow.axios.defaults.headers = {
        Authorization: 'null',
      };
    } else {
      resetState();

      this.flow.resetGlobalState();
    }

    setToken(token);
    setFlowId(matches.id);

    this.flow.setFlowId(matches.id);

    return this.flow.get()
      .then((flowStateResult) => {
        const brand = flowStateResult.state.brand || TEST_BRAND;
        const bodyPart = flowStateResult.state.bodyPart || TEST_BODY_PART;
        const photosFromGallery = flowStateResult.state.photosFromGallery || false;
        const { measurements } = flowStateResult.state;
        const { widget_settings } = flowStateResult;

        if (photosFromGallery) {
          setIsPhotosFromGallery(true);
        }

        // FOR PAGE RELOAD
        if (!flowState) {
          setFlowState(flowStateResult.state);
        }

        if (!widget_settings.is_custom_output_measurements && measurements) {
          setMeasurements(measurements);
        } else if (measurements) {
          setMeasurements({
            ...measurements,
            ...(filterCustomMeasurements(measurements, widget_settings.output_measurements)),
          });
        }

        if (widget_settings.gender !== 'all') {
          addGender(widget_settings.gender);
        } else {
          addGender(flowStateResult.state.gender);
        }

        setCustomSettings(widget_settings);
        setPersonId(flowStateResult.person || flowStateResult.state.personId);
        setBrand(brand);
        setBodyPart(bodyPart);
        setProductUrl(flowStateResult.state.productUrl);
        setIsMobile(isMobileDevice());
        addHeight(flowStateResult.state.height);
        setWeight(flowStateResult.state.weight);
        addFrontImage(flowStateResult.state.frontImage);
        addSideImage(flowStateResult.state.sideImage);
        setIsFromDesktopToMobile(true);
        setReturnUrl(flowStateResult.state.returnUrl || 'https://3dlook.me/mobile-tailor/');
        setSettings(flowStateResult.state.settings);
        setWidgetUrl(flowStateResult.state.widgetUrl || window.location.href);
        setBodyType(flowStateResult.state.bodyType);
        setFakeSize(flowStateResult.state.fakeSize);
        setEmail(flowStateResult.state.email);
        setPhoneNumber(flowStateResult.state.phoneNumber);
        setProductId(flowStateResult.state.productId);
        setUnits(flowStateResult.state.units || 'cm');
        setMtmClientId(flowStateResult.state.mtmClientId || flowStateResult.mtm_client);
        setFirstName(flowStateResult.state.firstName);
        setNotes(flowStateResult.state.notes);
        setWidgetId(flowStateResult.id);
      });
  }
}

export default BaseMobileFlow;

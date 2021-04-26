import {
  h,
  Component,
  Fragment,
} from 'preact';
import { route } from 'preact-router';
import API from '@3dlook/saia-sdk/lib/api';
import { connect } from 'react-redux';
import classNames from 'classnames';
import NoSleep from 'nosleep.js';

import Camera from '../../components/CustomCamera/CustomCamera';
import actions from '../../store/actions';
import FlowService from '../../services/flowService';
import { store } from '../../store';
import {
  send,
  wait,
  mobileFlowStatusUpdate,
  isMobileDevice,
  getAsset,
  filterCustomMeasurements,
} from '../../helpers/utils';
import {
  gaUploadOnContinue,
  gaOnClickLetsStartFrontFriend,
  gaOpenCameraFrontPhoto,
  gaOnClickLetsStartSideFriend,
  gaOpenCameraSidePhoto,
  gaOnClickLetsStartRequirements,
  gaOnClickDoneRequirements,
  gaTakePhotoFriendMode,
  gaTakePhotoAloneMode,
} from '../../helpers/ga';
import analyticsService, {
  FRONT_PHOTO_PAGE_EXAMPLE_OPEN,
  SIDE_PHOTO_PAGE_EXAMPLE_OPEN,
  FRONT_PHOTO_PAGE_EXAMPLE_CLOSE,
  SIDE_PHOTO_PAGE_EXAMPLE_CLOSE,
  FRONT_PHOTO_PAGE_OPEN_CAMERA,
  SIDE_PHOTO_PAGE_OPEN_CAMERA,
  FRONT_PHOTO_PAGE_PHOTO_TAKEN,
  SIDE_PHOTO_PAGE_PHOTO_TAKEN,
  MAGIC_SCREEN_PAGE_ENTER,
  MAGIC_SCREEN_PAGE_LEAVE,
  MAGIC_SCREEN_PAGE_SUCCESS,
  MAGIC_SCREEN_PAGE_FAILED,
} from '../../services/analyticsService';
import {
  Preloader,
  Stepper,
  UploadBlock,
  Requirements,
} from '../../components';
import { flowStatuses } from '../../configs/flowStatuses';

import './Upload.scss';

let isPhoneLocked = false;
let isRefreshed = false;

const noSleep = new NoSleep();

/**
 * Upload page component.
 */
class Upload extends Component {
  constructor(props) {
    super(props);

    this.init(props);

    this.state = {
      isFrontImageValid: true,
      isSideImageValid: true,

      // image errors
      frontImagePose: null,
      sideImagePose: null,

      isPending: false,
    };

    const { setPageReloadStatus } = props;

    this.reloadListener = () => {
      isRefreshed = true;
      setPageReloadStatus(true);
      noSleep.disable();
    };

    window.addEventListener('unload', this.reloadListener);
  }

  componentWillReceiveProps(nextProps) {
    this.init(nextProps);
  }

  componentWillUnmount() {
    const { setCamera } = this.props;

    setCamera(null);

    if (this.unsubscribe) this.unsubscribe();

    clearInterval(this.timer);

    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    document.removeEventListener('webkitvisibilitychange', this.handleVisibilityChange);
    window.removeEventListener('unload', this.reloadListener);
    window.removeEventListener('offline', this.setOfflineStatus);

    if (noSleep._wakeLock) {
      noSleep.disable();
    }
  }

  componentDidMount() {
    const {
      camera,
      setIsNetwork,
      isNetwork,
      flowId,
      pageReloadStatus,
      isFromDesktopToMobile,
      isDemoWidget,
      token,
      isTableFlow,
      frontImage,
    } = this.props;

    if (!isTableFlow) {
      analyticsService({
        uuid: token,
        event: !frontImage
          ? FRONT_PHOTO_PAGE_EXAMPLE_OPEN
          : SIDE_PHOTO_PAGE_EXAMPLE_OPEN,
      });
    }

    window.addEventListener('offline', this.setOfflineStatus);
    document.addEventListener('click', this.disableDeviceScreenLock, { once: true });

    // if camera is active when page refreshed
    if (camera) {
      const { setCamera } = this.props;

      setCamera(null);
    }

    if (!isNetwork) {
      // after not found page, if was network error
      setIsNetwork(true);
    }

    if (token && flowId && !this.flow) {
      this.flow = new FlowService(token);
      this.flow.setFlowId(flowId);

      // PAGE RELOAD: update flowState and set lastActiveDate for desktop loader
      if ((pageReloadStatus && isFromDesktopToMobile) || (pageReloadStatus && isDemoWidget)) {
        const { flowState, setPageReloadStatus } = this.props;

        setPageReloadStatus(false);

        mobileFlowStatusUpdate(this.flow, flowState);
      }
    }
  }

  componentDidUpdate(prevProps) {
    const {
      frontImage,
      sideImage,
      isTableFlow,
      token,
    } = this.props;

    if (!isTableFlow && !prevProps.frontImage && frontImage && !sideImage) {
      analyticsService({
        uuid: token,
        event: SIDE_PHOTO_PAGE_EXAMPLE_OPEN,
      });
    }

    if (!isTableFlow
        && ((!prevProps.sideImage && sideImage) || (!prevProps.frontImage && frontImage))) {
      const event = (!prevProps.sideImage && sideImage && SIDE_PHOTO_PAGE_EXAMPLE_CLOSE)
        || (!prevProps.frontImage && frontImage && FRONT_PHOTO_PAGE_EXAMPLE_CLOSE);

      analyticsService({
        uuid: token,
        event,
      });
    }
  }

  getFlowType = () => (this.props.isTableFlow ? 'alone' : 'friend');

  disableDeviceScreenLock = () => noSleep.enable();

  init(props) {
    const { token } = props;

    if (token && !this.api) {
      this.api = new API({
        host: `${API_HOST}/api/v2/`,
        key: token,
      });

      this.api.axios.defaults.headers = {
        Authorization: `UUID ${token}`,
      };
    }
  }

  /**
   * Save front image to state
   */
  saveFrontFile = (file) => {
    const {
      addFrontImage,
      setHeaderIconsStyle,
      setCamera,
      camera,
      isTableFlow,
      hardValidation,
      token,
    } = this.props;

    analyticsService({
      uuid: token,
      event: FRONT_PHOTO_PAGE_PHOTO_TAKEN,
    });

    gaOpenCameraFrontPhoto(this.getFlowType());

    setHeaderIconsStyle('default');
    addFrontImage(file);

    if (isTableFlow) {
      if (camera) {
        if (!(hardValidation.front && !hardValidation.side)) {
          this.triggerSideImage();
        }
      }
    } else {
      setCamera(null);
    }
  }

  /**
   * Save side image to state
   */
  saveSideFile = (file) => {
    const {
      addSideImage,
      isMobile,
      setHeaderIconsStyle,
      setCamera,
      isTableFlow,
      token,
    } = this.props;

    analyticsService({
      uuid: token,
      event: SIDE_PHOTO_PAGE_PHOTO_TAKEN,
    });

    gaOpenCameraSidePhoto(this.getFlowType());

    setHeaderIconsStyle('default');

    if (!isTableFlow) {
      setCamera(null);
    }

    if (isMobile) {
      this.unsubscribe = store.subscribe(() => {
        const state = store.getState();

        if (state.frontImage && state.sideImage) {
          this.unsubscribe();
          this.onNextButtonClick(null, state);
        }
      });
    }

    addSideImage(file);
  }

  turnOffCamera = () => {
    const { setCamera } = this.props;

    setCamera(null);
  }

  /**
   * On next button click handler
   *
   * @async
   */
  onNextButtonClick = async (e, props = this.props) => {
    if (e) {
      e.preventDefault();
    }

    const {
      frontImage,
      sideImage,
      height,
      gender,
      phoneNumber,
      firstName,
      notes,
      mtmClientId,
      widgetId,
      productUrl,
      deviceCoordinates,
    } = props;

    let { personId } = props;

    const {
      setSoftValidation,
      setHardValidation,
      addFrontImage,
      addSideImage,
      setPersonId,
      setMeasurements,
      origin,
      email,
      weight,
      units,
      setProcessingStatus,
      setMtmClientId,
      isFromDesktopToMobile,
      taskId,
      setTaskId,
      setBodyType,
      setFlowState,
      token,
      isTableFlow,
      customSettings,
    } = this.props;

    try {
      if (!frontImage) {
        this.setState({
          isFrontImageValid: false,
        });
      }

      if (!sideImage) {
        this.setState({
          isSideImageValid: false,
        });
      }

      if (!frontImage || !sideImage) {
        return;
      }

      // is phone locked detect
      let hidden;
      let visibilityChange;

      if (typeof document.hidden !== 'undefined') {
        hidden = 'hidden';
        visibilityChange = 'visibilitychange';
      } else if (typeof document.webkitHidden !== 'undefined') {
        hidden = 'webkitHidden';
        visibilityChange = 'webkitvisibilitychange';
      }

      if (!noSleep._wakeLock) {
        noSleep.enable();
      }

      this.handleVisibilityChange = async () => {
        if (document[hidden]) {
          isPhoneLocked = true;

          if (noSleep._wakeLock) {
            noSleep.disable();
          }

          await window.location.reload();
        }
      };

      document.addEventListener(visibilityChange, this.handleVisibilityChange);

      this.setState({
        isFrontImageValid: !!frontImage,
        isSideImageValid: !!sideImage,
        isPending: true,
      });

      if (isTableFlow) {
        analyticsService({
          uuid: token,
          event: FRONT_PHOTO_PAGE_EXAMPLE_CLOSE,
        });

        analyticsService({
          uuid: token,
          event: SIDE_PHOTO_PAGE_EXAMPLE_CLOSE,
        });
      }

      analyticsService({
        uuid: token,
        event: MAGIC_SCREEN_PAGE_ENTER,
      });

      let taskSetId;

      // use only real images
      // ignore booleans for mobile flow
      const images = {};

      if (frontImage !== true) {
        images.frontImage = frontImage;
      }

      if (sideImage !== true) {
        images.sideImage = sideImage;
      }

      const photoFlowType = isTableFlow ? 'hand' : 'friend';

      const mtmClientParams = {
        ...(firstName && { firstName }),
      };

      await this.api.mtmClient.update(mtmClientId, mtmClientParams);

      if (!personId) {
        if (isFromDesktopToMobile) {
          this.flow.updateLocalState({ processStatus: 'Initiating Profile Creation' });
        }

        setProcessingStatus('Initiating Profile Creation');

        const createdPersonId = await this.api.mtmClient.createPerson(mtmClientId, {
          gender,
          height,
          email,
          ...(weight && { weight }),
        });

        personId = createdPersonId;

        setPersonId(personId);

        await this.flow.update({
          ...(notes && { notes }),
          person: personId,
          state: {
            personId,
          },
        });

        setFlowState({ ...this.props.flowState, personId });

        await wait(1000);

        if (isFromDesktopToMobile) {
          this.flow.updateLocalState({ processStatus: 'Profile Creation Completed!' });
        }

        setProcessingStatus('Profile Creation Completed!');
        await wait(1000);

        if (isFromDesktopToMobile) {
          this.flow.updateLocalState({ processStatus: 'Photo Uploading' });
        }

        setProcessingStatus('Photo Uploading');

        taskSetId = await this.api.person.updateAndCalculate(createdPersonId, {
          ...images,
          photoFlowType,
          deviceCoordinates: { ...deviceCoordinates },
          measurementsType: 'all',
        });

        setTaskId(taskSetId);

        await wait(1000);

        if (isFromDesktopToMobile) {
          this.flow.updateLocalState({ processStatus: 'Photo Upload Completed!' });
        }

        setProcessingStatus('Photo Upload Completed!');
        await wait(1000);
      } else {
        if (isFromDesktopToMobile) {
          this.flow.updateLocalState({ processStatus: 'Photo Uploading' });
        }

        setProcessingStatus('Photo Uploading');

        await this.api.person.update(personId, {
          gender,
          height,
          email,
          photoFlowType,
          ...(weight && { weight }),
          deviceCoordinates: { ...deviceCoordinates },
          ...images,
        });
        await wait(1000);

        // do not calculate again id page reload
        if (!taskId) {
          taskSetId = await this.api.person.calculate(personId);

          setTaskId(taskSetId);
        } else {
          taskSetId = taskId;
        }

        if (isFromDesktopToMobile) {
          this.flow.updateLocalState({ processStatus: 'Photo Upload Completed!' });
        }

        setProcessingStatus('Photo Upload Completed!');
        await wait(1000);
      }

      if (isFromDesktopToMobile) {
        this.flow.updateLocalState({ processStatus: 'Calculating your Measurements' });
      }

      if (!noSleep._wakeLock) {
        noSleep.enable();
      }

      setProcessingStatus('Calculating your Measurements');

      const person = await this.api.queue.getResults(taskSetId, 4000, personId);

      await wait(1000);

      let measurements;

      if (!Object.keys(customSettings.outputMeasurements).length) {
        measurements = { ...person };
      } else {
        measurements = {
          ...person,
          ...(filterCustomMeasurements({ ...person }, customSettings)),
        };
      }

      send('data', measurements, origin);

      const softValidation = this.getSoftValidationParams(person);

      setBodyType(person.volume_params.body_type);
      setMeasurements(measurements);
      setSoftValidation(softValidation);

      if (isFromDesktopToMobile) {
        this.flow.updateLocalState({
          processStatus: 'Sending Your Results',
          status: flowStatuses.FINISHED,
          measurements,
          mtmClientId,
          softValidation,
        });
      } else {
        await this.flow.update({
          widget_flow_status: flowStatuses.FINISHED,
          state: {
            status: flowStatuses.FINISHED,
            measurements,
            mtmClientId,
            softValidation,
          },
        });
      }

      setProcessingStatus('Sending Your Results');
      await wait(1000);

      gaUploadOnContinue(this.getFlowType());

      setFlowState({ ...this.props.flowState, softValidation });

      analyticsService({
        uuid: token,
        event: MAGIC_SCREEN_PAGE_LEAVE,
      });
      analyticsService({
        uuid: token,
        event: MAGIC_SCREEN_PAGE_SUCCESS,
      });
      route('/results', true);
    } catch (error) {
      analyticsService({
        uuid: token,
        event: MAGIC_SCREEN_PAGE_FAILED,
      });
      if (!isPhoneLocked) {
        // hard validation part
        if (error && error.response && error.response.data && error.response.data.sub_tasks) {
          const subTasks = error.response.data.sub_tasks;

          const frontTask = subTasks.filter((item) => item.name.indexOf('front_') !== -1)[0];
          const sideTask = subTasks.filter((item) => item.name.indexOf('side_') !== -1)[0];
          const measurementError = subTasks.filter((item) => item.name.indexOf('measurement_') !== -1)[0];

          setHardValidation({
            front: frontTask.message,
            side: sideTask.message,
            ...(measurementError && { measurementError: true }),
          });

          // reset front image if there is hard validation error
          // in the front image
          if (frontTask.message) {
            addFrontImage(null);
          }

          // reset side image if there is hard validation error
          // in the side image
          if (sideTask.message) {
            addSideImage(null);
          }

          if (measurementError) {
            addFrontImage(null);
            addSideImage(null);
          }

          route('/hard-validation', true);
        } else if (error && error.response && error.response.status === 400) {
          route('/not-found', true);
        } else if (error && error.response && error.response.data) {
          const {
            detail,
            brand: brandError,
            body_part: bodyPartError,
          } = error.response.data;
          alert(detail || brandError || bodyPartError);
          route('/not-found', true);
        } else {
          if (error.message.includes('is not specified')) {
            const { returnUrl } = this.props;

            alert('Oops...\nThe server lost connection...\nPlease restart widget flow on the desktop or start again on mobile');

            window.location.href = returnUrl;

            return;
          }

          // for iphone after page reload
          await wait(2000);

          if (isRefreshed) return;

          console.error(error);

          route('/not-found', true);
        }
      }
    }
  }

  triggerFrontImage = () => {
    const {
      setCamera,
      token,
      isTableFlow,
    } = this.props;

    if (isTableFlow) {
      gaOnClickLetsStartRequirements(this.photoValidationDetect());
    } else {
      gaOnClickLetsStartFrontFriend(this.photoValidationDetect());
    }

    setCamera('front');

    analyticsService({
      uuid: token,
      event: FRONT_PHOTO_PAGE_OPEN_CAMERA,
    });
  }

  triggerSideImage = () => {
    const { setCamera, token } = this.props;

    gaOnClickLetsStartSideFriend(this.photoValidationDetect());

    setCamera('side');

    analyticsService({
      uuid: token,
      event: SIDE_PHOTO_PAGE_OPEN_CAMERA,
    });
  }

  openPhotoExample = (photoType) => {
    this.setState({
      isPhotoExample: true,
      photoType,
    });
  }

  closePhotoExample = () => {
    this.setState({
      isPhotoExample: false,
    });
  }

  setOfflineStatus = () => {
    const { setIsNetwork } = this.props;

    setIsNetwork(false);

    alert('Check your internet connection and try again');

    route('/not-found', true);
  }

  disableTableFlow = () => {
    const {
      setIsTableFlowDisabled,
      setIsTableFlow,
      setCamera,
    } = this.props;

    setCamera(null);
    setIsTableFlowDisabled(true);
    setIsTableFlow(false);
  }

  setDeviceCoordinates = (coords) => {
    const {
      addFrontDeviceCoordinates,
      addSideDeviceCoordinates,
      camera,
    } = this.props;

    if (camera === 'front') {
      addFrontDeviceCoordinates(coords);
    } else {
      addSideDeviceCoordinates(coords);
    }
  };

  getSoftValidationParams = (person) => {
    const softValidation = {
      looseTop: false,
      looseBottom: false,
      looseTopAndBottom: false,
      wideLegs: false,
      smallLegs: false,
      bodyPercentage: false,
    };

    if (person) {
      const {
        front_params: frontParams,
      } = person;

      if (frontParams) {
        if (frontParams.clothes_type && frontParams.clothes_type.types) {
          const { top, bottom } = frontParams.clothes_type.types;

          softValidation.looseTop = top.code === 't2' && bottom.code !== 'b1';
          softValidation.looseBottom = bottom.code === 'b1' && top.code !== 't2';
          softValidation.looseTopAndBottom = top.code === 't2' && bottom.code === 'b1';
        }

        softValidation.wideLegs = frontParams.legs_distance > 20;
        softValidation.smallLegs = frontParams.legs_distance < 2;
        softValidation.bodyPercentage = frontParams.body_area_percentage < 0.5;
      }
    }

    return softValidation;
  }

  photoValidationDetect = () => {
    const { isSoftValidationPresent, hardValidation } = this.props;

    if (hardValidation.front || hardValidation.side) return 'hard';

    if (isSoftValidationPresent) return 'soft';

    return '';
  }

  takePhotoGAEvent = (photoType) => {
    const { isTableFlow } = this.props;

    if (isTableFlow) {
      gaTakePhotoAloneMode(photoType, this.photoValidationDetect());
    } else {
      gaTakePhotoFriendMode(photoType, this.photoValidationDetect());
    }
  }

  render() {
    const isDesktop = !isMobileDevice();

    const {
      isPending,
      isFrontImageValid,
      isSideImageValid,
      frontImagePose,
      frontImageBody,
      sideImagePose,
      sideImageBody,
    } = this.state;

    const {
      frontImage,
      sideImage,
      gender,
      camera,
      sendDataStatus,
      isMobile,
      isPhotosFromGallery,
      isTableFlow,
      hardValidation,
      token,
    } = this.props;

    let title;
    let frontActive = false;
    let sideActive = false;

    if (isTableFlow) {
      title = 'requirements';
      frontActive = (!frontImage && !sideImage) || (!frontImage && sideImage);
      sideActive = frontImage && !sideImage;
    } else if ((!frontImage && !sideImage) || (!frontImage && sideImage)) {
      title = 'Take Front photo';
      frontActive = true;
    } else if (frontImage && !sideImage) {
      title = 'Take Side photo';
      sideActive = true;
    }

    return (
      <div className="screen active">
        {isDesktop ? (
          <div className="tutorial__desktop-msg">
            <h2>Please open this link on your mobile device</h2>
          </div>
        ) : (
          <Fragment>
            <Stepper steps="9" current={frontActive ? 7 : 8} />

            <div className="screen__content upload">
              <h3 className="screen__title upload__title">
                {title}

                <div className="upload__upload-file">
                  <UploadBlock
                    className={classNames({
                      active: frontActive,
                    })}
                    gender={gender}
                    type="front"
                    validation={{ pose: frontImagePose, body: frontImageBody }}
                    change={this.saveFrontFile}
                    isValid={isFrontImageValid}
                    value={frontImage}
                    openPhotoExample={this.openPhotoExample}
                    photosFromGallery={isPhotosFromGallery}
                  />
                  <UploadBlock
                    className={classNames({
                      active: sideActive,
                    })}
                    gender={gender}
                    type="side"
                    validation={{ pose: sideImagePose, body: sideImageBody }}
                    change={this.saveSideFile}
                    isValid={isSideImageValid}
                    value={sideImage}
                    openPhotoExample={this.openPhotoExample}
                    photosFromGallery={isPhotosFromGallery}
                  />
                </div>
              </h3>

              <Requirements
                isTableFlow={isTableFlow}
                token={token}
                video={isTableFlow && getAsset(true, gender, 'videoExample')}
                photoBg={!isTableFlow && getAsset(false, gender, frontActive ? 'frontExample' : 'sideExample')}
              />
            </div>
            <div className="screen__footer">
              <button
                className={classNames('button', 'upload__front-image-btn', {
                  active: frontActive,
                })}
                onClick={this.triggerFrontImage}
                type="button"
              >
                Let&apos;s start
              </button>

              <button
                className={classNames('button', 'upload__side-image-btn', {
                  active: sideActive,
                })}
                onClick={this.triggerSideImage}
                type="button"
              >
                Let&apos;s start
              </button>
            </div>
          </Fragment>
        )}

        <Preloader
          isActive={isPending}
          status={sendDataStatus}
          isMobile={isMobile}
          gender={gender}
        />

        {camera ? (
          <Camera
            gaTakePhoto={this.takePhotoGAEvent}
            onClickDone={() => { gaOnClickDoneRequirements(this.photoValidationDetect()); }}
            type={camera}
            gender={gender}
            saveFront={this.saveFrontFile}
            saveSide={this.saveSideFile}
            isTableFlow={isTableFlow}
            hardValidation={hardValidation}
            disableTableFlow={this.disableTableFlow}
            turnOffCamera={this.turnOffCamera}
            setDeviceCoordinates={this.setDeviceCoordinates}
            token={token}
          />
        ) : null}
      </div>
    );
  }
}

export default connect((state) => state, actions)(Upload);

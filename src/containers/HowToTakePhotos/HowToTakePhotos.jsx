import {
  h,
  Component,
  createRef,
} from 'preact';
import { connect } from 'react-redux';
import { Link } from 'preact-router';

import actions from '../../store/actions';
import { Loader, Stepper } from '../../components';
import {
  gaOnClickNextHowTakePhotos,
  gaOnClickReplay,
  gaOnClickNextAloneTakePhotos,
  gaOnClickReplayAlone,
} from '../../helpers/ga';
import FlowService from '../../services/flowService';
import { getAsset, mobileFlowStatusUpdate } from '../../helpers/utils';
import analyticsService, {
  HOW_TO_TAKE_PHOTOS_PAGE_ENTER,
  HOW_TO_TAKE_PHOTOS_PAGE_LEAVE,
  HOW_TO_TAKE_PHOTOS_PAGE_REPLAY,
} from '../../services/analyticsService';

import './HowToTakePhotos.scss';

/**
 * HowToTakePhotos video page component
 */
class HowToTakePhotos extends Component {
  $video = createRef();

  $videoProgress = createRef();

  constructor(props) {
    super(props);

    this.state = {
      // videoText: props.isTableFlow
      //   ? 'Stand your device upright on a table. \n You can use an object to help hold it up.'
      //   : 'Ask someone to help take 2 photos of you. \n Keep the device at 90° angle at the waistline.',
      videoText: props.isTableFlow ? 'スマートフォンをテーブルに立てかけてください。 \n 何かで支えても構いません。' : '2枚の写真を撮ってもらってください。 \n スマートフォンは腰の高さで90°に保ってください。',
      isVideoLoaded: false,
    };

    const { setPageReloadStatus } = props;

    this.reloadListener = () => {
      setPageReloadStatus(true);
    };

    window.addEventListener('unload', this.reloadListener);
  }

  componentWillUnmount() {
    window.removeEventListener('unload', this.reloadListener);
  }

  componentDidMount = () => {
    const { current } = this.$video;

    current.play();

    current.addEventListener('timeupdate', this.handleProgress);

    const {
      isFromDesktopToMobile,
      pageReloadStatus,
      token,
      flowId,
      isDemoWidget,
      isTableFlow,
    } = this.props;

    analyticsService({
      uuid: token,
      event: HOW_TO_TAKE_PHOTOS_PAGE_ENTER,
      data: {
        value: isTableFlow ? 'hands-free' : 'with-friend',
      },
    });

    this.flow = new FlowService(token);
    this.flow.setFlowId(flowId);

    // PAGE RELOAD: update flowState and set lastActiveDate for desktop loader
    if ((pageReloadStatus && isFromDesktopToMobile) || (pageReloadStatus && isDemoWidget)) {
      const { setPageReloadStatus, flowState } = this.props;

      setPageReloadStatus(false);

      mobileFlowStatusUpdate(this.flow, flowState);
    }
  }

  componentWillUnmount = () => {
    const { token, isTableFlow } = this.props;

    this.$video.current.removeEventListener('timeupdate', this.handleProgress);

    analyticsService({
      uuid: token,
      event: HOW_TO_TAKE_PHOTOS_PAGE_LEAVE,
      data: {
        value: isTableFlow ? 'hands-free' : 'with-friend',
      },
    });
  }

  handleProgress = () => {
    const { current } = this.$video;
    const { isTableFlow } = this.props;
    const percent = (current.currentTime / current.duration) * 100;

    if (isTableFlow) {
      this.setTableFlowVideoText(current.currentTime);
    } else {
      this.setFriendFlowVideoText(current.currentTime);
    }

    this.$videoProgress.current.style.flexBasis = `${percent}%`;
  }

  restartVideo = () => {
    const { token, isTableFlow } = this.props;
    const { current } = this.$video;

    if (this.props.isTableFlow) {
      gaOnClickReplayAlone();
    } else {
      gaOnClickReplay();
    }

    current.currentTime = 0;
    current.play();

    analyticsService({
      uuid: token,
      event: HOW_TO_TAKE_PHOTOS_PAGE_REPLAY,
      data: {
        value: isTableFlow ? 'hands-free' : 'with-friend',
      },
    });
  }

  setTableFlowVideoText = (time) => {
    if (time < 3.8) {
      this.setState({
        // videoText: 'Stand your device upright on a table. \n You can use an object to help hold it up.',
        videoText: 'スマートフォンをテーブルに立てかけてください。 \n 何かで支えても構いません。',
      });
    } else if (time > 3.8 && time < 7) {
      this.setState({
        // videoText: 'Angle the phone so that the arrows line up on the green',
        videoText: 'スマートフォンの角度を調整し、矢印が緑色の線に重なるようにしてください。',
      });
    } else if (time > 7 && time < 13.5) {
      this.setState({
        // videoText: 'Take 3 to 4 steps away from your device.',
        videoText: 'スマートフォンから3,4歩下がってください。',
      });
    } else if (time > 13.5) {
      this.setState({
        // videoText: 'Please turn up the volume and follow the voice instructions.',
        videoText: '音量を上げて、音声の指示に従ってください。',
      });
    }
  }

  setFriendFlowVideoText = (time) => {
    if (time < 3) {
      this.setState({
        // videoText: 'Ask someone to help take 2 photos of you. \n Keep the device at 90° angle at the waistline.',
        videoText: '2枚の写真を撮ってもらってください。 \n スマートフォンは腰の高さで90°の角度を保ってください。',
      });
    } else if (time > 3) {
      this.setState({
        // videoText: 'For the side photo turn to your left.',
        videoText: '横向きの写真を取る際は、左を向いてください。',
      });
    }
  }

  onVideoLoad = () => {
    this.setState({
      isVideoLoaded: true,
    });
  }

  onClickNext = () => {
    if (this.props.isTableFlow) {
      return gaOnClickNextAloneTakePhotos();
    }

    gaOnClickNextHowTakePhotos();
  }

  render() {
    const { isTableFlow, gender } = this.props;
    const { videoText, isVideoLoaded } = this.state;

    return (
      <div className="screen active">
        <Stepper steps="9" current="6" />

        <div className="screen__content how-to-take-photos">
          <div className="how-to-take-photos__content">
            <h3 className="screen__title">写真の取り方</h3>

            {!isVideoLoaded ? <Loader /> : null}

            <div className="how-to-take-photos__video-wrap">
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video
                className="how-to-take-photos__video"
                ref={this.$video}
                muted
                preload="auto"
                playsInline
                autoPlay
                onPlay={this.onVideoLoad}
                width="960"
                height="540"
              >
                <source src={getAsset(isTableFlow, gender, 'video')} type="video/mp4" />
              </video>

              <div className="how-to-take-photos__progress-bar">
                <div
                  className="how-to-take-photos__progress"
                  ref={this.$videoProgress}
                />
              </div>
            </div>
            <div className="how-to-take-photos__btn-wrap">
              <p>{videoText}</p>
              <button
                className="how-to-take-photos__btn"
                onClick={this.restartVideo}
                type="button"
              >
                <i>&#8635;</i>
                <span>再生</span>
              </button>
            </div>
          </div>
        </div>

        <div className="screen__footer">
          <Link className="button" href="/upload" onClick={this.onClickNext}>
            Next
          </Link>
        </div>
      </div>
    );
  }
}

export default connect((state) => state, actions)(HowToTakePhotos);

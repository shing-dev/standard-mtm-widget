import { h, Component } from 'preact';
import { route, Link } from 'preact-router';
import API from '@3dlook/saia-sdk/lib/api';
import { connect } from 'react-redux';
import classNames from 'classnames';
import Clipboard from 'clipboard';
import IntlTelInput from 'react-intl-tel-input';

import { send, validatePhoneNumberLetters } from '../../helpers/utils';
import { gaCopyUrl } from '../../helpers/ga';

import actions from '../../store/actions';

import FlowService from '../../services/flowService';
import SMSService from '../../services/smsService';

import {
  Preloader,
  QRCodeBlock,
  Stepper,
  Loader,
} from '../../components';

import './QRCodeContainer.scss';
import smsSendingIcon from '../../images/sms-sending.svg';

/**
 * ScanQRCode page component.
 */
class QRCodeContainer extends Component {
  constructor(props) {
    super(props);

    this.init(props);

    this.state = {
      isPending: false,
      isSMSPending: false,
      isSMSSuccess: false,

      qrCodeUrl: null,
      copyUrl: null,
      isShortUrlFetching: true,
      isCopied: false,

      isPhoneNumberValid: true,
      phoneNumber: null,

      resendTime: 60,
    };
  }

  componentDidMount() {
    const { flowId, token } = this.props;
    const mobileFlowUrl = `${window.location.origin}${window.location.pathname}?key=${token}#/mobile/${flowId}`;

    this.setState({
      qrCodeUrl: mobileFlowUrl,
    });

    // init clipboard
    this.clipboard = new Clipboard('.scan-qrcode__btn');

    this.sms = new SMSService(token);
    this.sms.getShortLink(mobileFlowUrl)
      .then((res) => {
        this.setState({
          copyUrl: res.short_link,
          isShortUrlFetching: false,
        });
      })
      .catch(() => { this.setState({ isShortUrlFetching: false }); })
      .finally(async () => {
        const { copyUrl, qrCodeUrl } = this.state;

        await this.flow.updateState({
          widgetUrl: copyUrl || qrCodeUrl,
        });
      });
  }

  // TODO *** change
  componentWillReceiveProps(nextProps) {
    this.init(nextProps);
  }

  componentWillUnmount() {
    if (this.unsubscribe) this.unsubscribe();
    clearInterval(this.timer);
  }

  /**
   * Change phone number
   */
  changePhoneNumber = (isValid, number, country) => {
    const phoneNumber = `${country.dialCode}${number}`;
    const noLettersCheck = validatePhoneNumberLetters(phoneNumber);

    this.setState({
      isPhoneNumberValid: isValid && noLettersCheck,
      phoneNumber,
    });
  }

  init(props) {
    const {
      token,
      flowId,
      isMobile,
      setMeasurements,
    } = props;

    if (token && flowId && !this.api && !this.flow) {
      this.api = new API({
        host: `${API_HOST}/api/v2/`,
        key: token,
      });

      this.flow = new FlowService(token);
      this.flow.setFlowId(flowId);

      if (!isMobile) {
        this.timer = setInterval(() => {
          this.flow.get()
            .then((flowState) => {
              if (flowState.state.status === 'close-confirm') {
                return;
              }

              if (flowState.state.status === 'opened-on-mobile' && flowState.state.lastActiveDate) {
                this.setState({
                  isPending: true,
                });

                const currentTime = Date.now();
                const widgetWasAliveAt = flowState.state.lastActiveDate;

                if ((currentTime - widgetWasAliveAt) > 9000) {
                  this.setState({
                    isPending: false,
                  });
                }
              }

              if (flowState.state.status === 'finished') {
                const { measurements } = flowState.state;
                setMeasurements(measurements);

                route('/results', true);
              }
            })
            .catch((err) => console.log(err));
        }, 3000);
      }
    }
  }

  copyUrl = () => {
    gaCopyUrl();

    const { onCopy } = this.props;

    this.resendTimer();

    if (onCopy) {
      onCopy();
    }

    this.setState({
      isCopied: true,
    }, () => {
      const timer = setTimeout(() => {
        this.setState({
          isCopied: false,
        }, () => clearTimeout(timer));
      }, 3000);
    });
  }

  showQRCodeHelp = () => {
    route('/qrcode-help');
  }

  sendSMS = () => {
    const { phoneNumber, qrCodeUrl } = this.state;

    if (!phoneNumber) {
      this.setState({
        isPhoneNumberValid: false,
      });
    } else {
      this.setState({
        isSMSPending: true,
      });

      this.sms.send(phoneNumber, qrCodeUrl)
        .then(() => {
          this.resendTimer();

          this.setState({
            isSMSPending: false,
            isSMSSuccess: true,
          });

          return this.flow.updateState({
            phoneNumber,
          });
        })
        .catch((err) => {
          const retrySmsTime = err.response.headers['retry-after'];

          if (retrySmsTime && retrySmsTime >= 0) {
            this.setState({
              isSMSPending: false,
              resendTime: retrySmsTime,
              isSMSSuccess: true,
            });

            this.resendTimer();

            return;
          }

          this.setState({
            isSMSPending: false,
            isSMSSuccess: false,
          });
          alert(err.messaage);
        });
    }
  }

  resendTimer = () => {
    const { resendTime } = this.state;
    let time = resendTime;

    clearInterval(this.SmsTimer);

    this.SmsTimer = setInterval(() => {
      if (time === 0) {
        clearInterval(this.SmsTimer);

        this.setState({
          isSMSSuccess: false,
          resendTime: 60,
        });

        return;
      }

      this.setState({
        resendTime: time -= 1,
      });
    }, 1000);
  };

  render() {
    const {
      qrCodeUrl,
      isPending,
      isCopied,
      isPhoneNumberValid,
      phoneNumber,
      isSMSPending,
      isSMSSuccess,
      resendTime,
      copyUrl,
      isShortUrlFetching,
    } = this.state;

    const qrCopyUrl = copyUrl || qrCodeUrl;

    return (
      <div className="screen active">
        <div className={classNames('screen__content', 'scan-qrcode')}>
          {(!isPending) ? (
            <Stepper steps="5" current="2" />
          ) : (
            null
          )}

          <h3 className="screen__title scan-qrcode__title">SCAN THIS QR CODE</h3>
          <p>and proceed on your mobile device</p>

          <div className="scan-qrcode__help-btn">
            <Link href="/qrcode-help">
              How to use QR code
            </Link>
          </div>

          <div className={classNames('scan-qrcode__qrcode-wrap', { 'scan-qrcode__qrcode-wrap--hidden': isShortUrlFetching })}>
            <QRCodeBlock className="scan-qrcode__qrcode" data={qrCopyUrl} />

            {isShortUrlFetching ? (
              <Loader />
            ) : false}

          </div>

          <button className={classNames('scan-qrcode__btn', { 'scan-qrcode__btn--copied': isCopied })} disabled={isShortUrlFetching} type="button" data-clipboard-text={qrCopyUrl} onClick={this.copyUrl}>
            {(!isCopied) ? 'Copy link' : 'Link copied'}
            <svg width="11px" height="14px" viewBox="0 0 11 14" version="1.1" xmlns="http://www.w3.org/2000/svg">
              <g stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                <g className="qrcode__btn-svg" transform="translate(-325.000000, -341.000000)" stroke="#FFAB55" strokeWidth="1.3">
                  <g transform="translate(326.000000, 342.000000)">
                    <path d="M1.27272727,10 C0.569819409,10 0,9.36040679 0,8.57142857 L0,1.42857143 C0,0.639593215 0.569819409,0 1.27272727,0 L1.27272727,0 L5.72727273,0 C6.43018059,0 7,0.639593215 7,1.42857143 L7,1.42857143" id="Path" />
                    <rect id="Rectangle" x="2.65" y="2.65" width="6.7" height="9.7" rx="2" />
                  </g>
                </g>
              </g>
            </svg>
          </button>

          <h3 className="screen__title scan-qrcode__title-2">or enter your mobile number</h3>

          <div className="screen__control scan-qrcode__control">
            <IntlTelInput
              containerClassName="intl-tel-input"
              inputClassName={
                classNames(
                  'input',
                  'scan-qrcode__phone',
                  {
                    'input--invalid': !isPhoneNumberValid,
                    'input--dirty': !!phoneNumber,
                  },
                )
              }
              separateDialCode="true"
              onPhoneNumberBlur={this.changePhoneNumber}
            />
            <p className={classNames('scan-qrcode__error', { active: !isPhoneNumberValid })}>Invalid phone number</p>

            <p>and get a link via text message</p>
          </div>
        </div>
        <div className="screen__footer">
          <button className={classNames('button', { 'button--sms-pending': isSMSPending, 'button--sms-success': isSMSSuccess })} onClick={this.sendSMS} type="button" disabled={isSMSPending || !isPhoneNumberValid || !phoneNumber || isSMSSuccess}>
            {(isSMSPending) ? (
              <img className="spin" src={smsSendingIcon} alt="sms sending" />
            ) : null }

            {(isSMSPending) ? (
              'SENDING'
            ) : null }
            {(isSMSSuccess) ? (
              `Try again in ${resendTime}`
            ) : null }
            {(!isSMSSuccess && !isSMSPending) ? (
              'Send'
            ) : null }
          </button>
        </div>

        <Preloader isActive={isPending} />
      </div>

    );
  }
}

export default connect((state) => state, actions)(QRCodeContainer);

import { h } from 'preact';

import './Preloader.scss';
import firstStage from '../../images/stage_1.svg';
import secondStage from '../../images/stage_2.svg';
import thirdStage from '../../images/stage_3.svg';
import indicator from '../../images/line.svg';

/**
 * Preloader component
 */
const Preloader = ({ isActive, status, isMobile }) => (
  <div className={`preloader ${isActive ? 'active' : ''}`}>
    <div className="preloader__title-wrap">
      <h2 className="preloader__title screen__title">
        The magic is happening
      </h2>

      <p className="preloader__status">{status}</p>
    </div>

    <div className="preloader__animation">
      <img className="preloader__animation-stage preloader__animation-stage--first" src={firstStage} alt="stage-1" />
      <img className="preloader__animation-stage preloader__animation-stage--second" src={secondStage} alt="stage-2" />
      <img className="preloader__animation-stage preloader__animation-stage--third" src={thirdStage} alt="stage-3" />
      <img className="preloader__animation-indicator" src={indicator} alt="line" />
    </div>

    {isMobile ? (
      <div className="preloader__warning-block">
        <div className="preloader__warning-icon">×</div>
        <p className="preloader__warning-txt">
          Please
          <b> do not lock your phone, </b>
          we are
          computing your measurements! &#128522;
        </p>
      </div>
    ) : (
      <p className="preloader__text">
        <span>
          It might take us up to
          <b> one minute </b>
          to find your perfect fit. Thanks for being patient!
        </span>
      </p>
    )}
  </div>
);

export default Preloader;

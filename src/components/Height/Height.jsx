import {
  h,
  Component,
  createRef,
} from 'preact';
import classNames from 'classnames';

import {
  cmToFtIn,
  getHeightCm,
  closeSelectsOnResize,
} from '../../helpers/utils';
import analyticsService, {
  HEIGHT_PAGE_METRIC_SELECTED,
  HEIGHT_PAGE_IMPERIAL_SELECTED,
} from '../../services/analyticsService';

import './Height.scss';

/**
 * Height component
 */
export default class Height extends Component {
  $heightCmEl = createRef();

  $heightFtEl = createRef();

  constructor(props) {
    super(props);

    this.defaultValueMetric = 15;
    this.defaultValueImperial = 6;
    this.minHeightCm = 150;
    this.maxHeightCm = 220;

    this.state = {
      units: 'cm',
      cm: null,
      ft: null,
      inches: null,
    };

    const generateFtInValues = () => {
      const result = [];

      for (let i = 4; i <= 7; i++) {
        if (i === 4) {
          result.push({ ft: i, in: 11 });
        }

        if (i === 5 || i === 6) {
          for (let a = 0; a <= 11; a++) {
            result.push({ ft: i, in: a });
          }
        }

        if (i === 7) {
          for (let b = 0; b <= 2; b++) {
            result.push({ ft: i, in: b });
          }
        }
      }

      return result;
    };

    this.heightCmValues = [...Array(this.maxHeightCm + 1).keys()].slice(this.minHeightCm);
    this.heightFtInValues = generateFtInValues();
  }

  /**
   * Add event
   */
  componentDidMount() {
    const {
      height,
      units,
      isMobile,
    } = this.props;

    // for close select drop on landscape view
    if (isMobile) window.addEventListener('resize', closeSelectsOnResize);

    // for set default select value to input after first click
    if (this.$heightCmEl.current) this.$heightCmEl.current.addEventListener('click', this.onCmInputChange, { once: true });
    if (this.$heightFtEl.current) this.$heightFtEl.current.addEventListener('click', this.onImperialSelectChange, { once: true });

    if (height && (height >= this.minHeightCm && height <= this.maxHeightCm)) {
      const ftIn = cmToFtIn(height);

      this.setState({
        units,
        cm: height || null,
        ft: ftIn.ft || null,
        inches: this.setInches(ftIn),
      });

      return;
    }

    this.setState({
      units,
    });
  }

  componentWillUnmount() {
    window.removeEventListener('resize', closeSelectsOnResize);
  }

  setInches = (data) => {
    if (data.ft === 7 && data.in === 3) {
      return 2;
    }

    return data.in;
  };

  /**
   * Units change handler
   */
  onUnitsChange = (e) => {
    const { changeUnits } = this.props;
    const units = e.target.value;

    this.setState({
      units,
    }, () => changeUnits(units));
  }

  /**
   * Switch element click handler
   */
  onSwitchClick = () => {
    const { changeUnits, token } = this.props;
    let units;

    this.setState((prevState) => {
      units = (prevState.units === 'cm') ? 'in' : 'cm';

      return {
        units,
      };
    }, () => {
      changeUnits(units);
      analyticsService({
        uuid: token,
        event: units === 'cm'
          ? HEIGHT_PAGE_METRIC_SELECTED
          : HEIGHT_PAGE_IMPERIAL_SELECTED,
      });
    });
  }

  /**
   * Cm change handler
   */
  onCmInputChange = (e) => {
    const { change } = this.props;
    // get height in cm
    const { value } = e.target;
    // get ft and in

    const ftIn = cmToFtIn(value);

    this.setState({
      cm: value || null,
      ft: ftIn.ft || null,
      inches: this.setInches(ftIn),
    }, () => {
      const { cm } = this.state;
      change(cm);
    });
  }

  /**
   * Ft change handler
   */
  onFtInputChange = (e) => {
    const { change } = this.props;
    const { inches } = this.state;

    // get ft
    const { value } = e.target;

    // convert value to cm
    let centimeters = getHeightCm(value, inches || 0);

    centimeters = Math.round(centimeters);

    this.setState({
      cm: centimeters || null,
      ft: value || null,
      inches: inches || null,
    }, () => {
      const { cm } = this.state;
      change(cm);
    });
  }

  /**
   * Inches change handler
   */
  onInInputChange = (e) => {
    const { change } = this.props;
    const { ft } = this.state;

    // get inches
    const { value } = e.target;

    // convert value to cm
    let centimeters = getHeightCm(ft || 0, value || 0);

    centimeters = Math.round(centimeters);

    this.setState({
      cm: centimeters || null,
      ft: ft || null,
      inches: value || null,
    }, () => {
      const { cm } = this.state;

      change(cm);
    });
  }

  /**
   * Imperial change handler
   */
  onImperialSelectChange = (e) => {
    const { change } = this.props;
    const { value } = e.target;
    const { ft } = this.heightFtInValues[value];
    const inches = this.heightFtInValues[value].in;

    // convert value to cm
    let centimeters = getHeightCm(ft, inches);

    centimeters = Math.round(centimeters);

    this.setState({
      cm: centimeters,
      ft,
      inches,
    }, () => {
      const { cm } = this.state;

      change(cm);
    });
  }

  render() {
    const {
      className,
      isValid,
      isMobile,
    } = this.props;

    const {
      units,
      cm,
      ft,
      inches,
    } = this.state;

    return (
      <div className={classNames(className, 'height', { 'height--invalid': !isValid })} data-measure={units}>
        <div className="height__measure height__measure--cm">
          <div className="height__input-block" data-measure="cm">
            <input
              className={classNames('input', { 'input--invalid': !isValid })}
              type="number"
              value={cm}
              onBlur={this.onCmInputChange}
              placeholder="0"
              disabled={isMobile}
            />
            <p className="height__input-placeholder">CM</p>
            {isMobile ? (
              <select onChange={this.onCmInputChange} ref={this.$heightCmEl}>
                {this.heightCmValues.map((value, index) => (
                  <option value={value} selected={index === this.defaultValueMetric}>
                    {value}
                    {' '}
                    cm
                  </option>
                ))}
              </select>
            ) : false}
          </div>
        </div>

        <div className="height__measure height__measure--in">
          <div className="height__input-block" data-measure="ft">
            <input
              className={classNames('input', { 'input--invalid': !isValid })}
              type="number"
              value={ft}
              onBlur={this.onFtInputChange}
              placeholder="0"
            />
            <p className="height__input-placeholder">FT</p>
          </div>
          <div className="height__input-block" data-measure="in">
            <input
              className={classNames('input', { 'input--invalid': !isValid })}
              type="number"
              value={inches}
              onBlur={this.onInInputChange}
              placeholder="0"
              disabled={isMobile}
            />
            <p className="height__input-placeholder">IN</p>
          </div>
          {isMobile ? (
            <select onChange={this.onImperialSelectChange} ref={this.$heightFtEl}>
              {this.heightFtInValues.map((value, index) => (
                <option value={index} selected={index === this.defaultValueImperial}>
                  {`${value.ft} ft ${value.in} in`}
                </option>
              ))}
            </select>
          ) : false}
        </div>

        <p className={classNames('screen__control-error', 'height__desc', { active: !isValid })}>
          {(units === 'cm' && !isValid) ? '100-250 cm の間で入力してください' : null}
          {(units === 'in' && !isValid) ? 'Your height should be between 4’11” and 7’2”' : null}
        </p>
      </div>
    );
  }
}

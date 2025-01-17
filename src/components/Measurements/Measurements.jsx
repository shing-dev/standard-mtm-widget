import { Component, h } from 'preact';
import cn from 'classnames';

import { cm2in } from '../../helpers/utils';
import './Measurements.scss';
import { VOLUMETRIC_PARAMS, LINEAR_PARAMS } from '../../helpers/bodyParametersInfo';

import { Loader } from '..';

/*
 * Measurements component
 */

class Measurements extends Component {
  constructor() {
    super();

    this.state = {
      measurementsLoading: true,
    };
  }

  componentDidMount() {
    const { measurements } = this.props;

    if (measurements.id) {
      this.setState({
        measurementsLoading: false,
      });
    }
  }

  componentWillReceiveProps(nextProps) {
    const { measurements } = nextProps;

    if (measurements.id) {
      this.setState({
        measurementsLoading: false,
      });
    }
  }

  handleClick = (e) => {
    const { openGuide, helpBtnToggle } = this.props;
    const { target } = e;

    if (target.type === 'button') {
      helpBtnToggle(false);
      openGuide(target.dataset.key, target.dataset.measurement);
    }
  }

  getMeasurements = (e) => {
    const { measurements, units } = this.props;
    const { paramName } = e;
    const measurementsParamName = measurements[e.paramGroup][paramName];

    if (units === 'in' && paramName !== 'shoulder_slope') {
      return `${cm2in(measurementsParamName).toFixed(1)}"`;
    }

    return `${measurementsParamName} ${paramName === 'shoulder_slope' ? '°' : 'cm'}`;
  }

  render() {
    const { measurementsLoading } = this.state;
    const {
      measurements,
      isSoftValidation,
      isCustomMeasurements,
      isOpenGuide
    } = this.props;
    let parameters = [VOLUMETRIC_PARAMS, LINEAR_PARAMS];
    let groups = ['Volumetric measurements', 'Linear measurements'];

    if (Object.keys(measurements.front_params).length <= 2
      && Object.keys(measurements.side_params).length <= 2) {
      groups = ['Volumetric measurements'];
      parameters = [VOLUMETRIC_PARAMS];
    } else if (Object.keys(measurements.volume_params).length < 1) {
      groups = ['Linear measurements'];
      parameters = [LINEAR_PARAMS];
    }

    return (
      <div
        className={cn('measurements__wrapper', {
          'measurements__wrapper--custom-height': isSoftValidation && isCustomMeasurements && !isOpenGuide,
        })}
      >

        {measurementsLoading ? (
          <Loader />
        ) : null}

        <div className="measurements">

          {groups.map((group, i) => (
            <div className="measurements__list-wrapper">
              <h4 className="measurements__title">{group}</h4>
              {/* eslint-disable-next-line max-len */}
              {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-noninteractive-element-interactions */}
              <ul className="measurements__list" onClick={this.handleClick}>

                {parameters[i].map((e, index) => (
                  measurements[e.paramGroup] && measurements[e.paramGroup][e.paramName] ? (
                    <li className="measurements__measurement">
                      <button
                        className="measurements__measurement-label"
                        data-key={index}
                        data-measurement={e.paramGroup}
                        type="button"
                      >
                        {e.name}
                      </button>
                      <span className="measurements__measurement-value">
                        {this.getMeasurements(e)}
                      </span>
                    </li>
                  ) : null))}

              </ul>
            </div>
          ))}
        </div>
      </div>
    );
  }
}

export default Measurements;

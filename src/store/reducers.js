import { CONSTANTS } from './actions';

export const INITIAL_STATE = {
  measurements: {
    front_params: {},
    side_params: {},
    volume_params: {},
  },
  origin: null,
  returnUrl: null,
  widgetUrl: null,
  isFromDesktopToMobile: false,
  isMobile: false,
  token: null,

  gender: null,
  height: null,
  weight: null,
  weightLb: null,
  bodyType: null,

  frontImage: null,
  sideImage: null,

  flowId: null,
  widgetId: null,
  personId: null,
  mtmClientId: null,
  flowState: null,

  brand: null,
  bodyPart: null,
  productUrl: null,
  productId: null,

  recommendations: {
    tight: null,
    normal: null,
    loose: null,
  },

  softValidation: {
    front: {
      bodyAreaPercentage: null,
      legsDistance: null,
      messages: [],
    },
    side: {
      bodyAreaPercentage: null,
      messages: [],
    },
  },

  hardValidation: {
    front: null,
    side: null,
  },

  email: null,
  units: 'in',
  firstName: null,
  phoneNumber: null,
  notes: null,
  phoneCountry: null,
  phoneUserPart: null,
  fakeSize: false,

  settings: {
    final_page: 'measurements',
  },

  headerIconsStyle: 'default',
  camera: null,
  isHelpActive: false,
  isOpenReturnUrlDesktop: false,
  sendDataStatus: '',
  pageReloadStatus: false,
  helpBtnStatus: true,

  isNetwork: true,

  source: 'widget',

  photosFromGallery: false,

  isSmbFlow: false,
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case CONSTANTS.SET_MEASUREMENTS:
      return {
        ...state,
        measurements: action.payload,
      };

    case CONSTANTS.RESET_STATE:
      return {
        ...INITIAL_STATE,
      };

    case CONSTANTS.SET_IS_MOBILE:
      return {
        ...state,
        isMobile: action.payload,
      };

    case CONSTANTS.SET_IS_FROM_DESKTOP_TO_MOBILE:
      return {
        ...state,
        isFromDesktopToMobile: action.payload,
      };

    case CONSTANTS.SET_RETURN_URL:
      return {
        ...state,
        returnUrl: action.payload,
      };

    case CONSTANTS.SET_WIDGET_URL:
      return {
        ...state,
        widgetUrl: action.payload,
      };

    case CONSTANTS.SET_ORIGIN:
      return {
        ...state,
        origin: action.payload,
      };

    case CONSTANTS.SET_TOKEN:
      return {
        ...state,
        token: action.payload,
      };

    case CONSTANTS.ADD_FRONT_IMAGE:
      return {
        ...state,
        frontImage: action.payload,
      };

    case CONSTANTS.ADD_SIDE_IMAGE:
      return {
        ...state,
        sideImage: action.payload,
      };

    case CONSTANTS.ADD_GENDER:
      return {
        ...state,
        gender: action.payload,
      };

    case CONSTANTS.ADD_HEIGHT:
      return {
        ...state,
        height: action.payload,
      };

    case CONSTANTS.ADD_AGREE:
      return {
        ...state,
        agree: action.payload,
      };

    case CONSTANTS.SET_FLOW_ID:
      return {
        ...state,
        flowId: action.payload,
      };

    case CONSTANTS.SET_WIDGET_ID:
      return {
        ...state,
        widgetId: action.payload,
      };

    case CONSTANTS.SET_PERSON_ID:
      return {
        ...state,
        personId: action.payload,
      };

    case CONSTANTS.SET_BODY_PART:
      return {
        ...state,
        bodyPart: action.payload,
      };

    case CONSTANTS.SET_BRAND:
      return {
        ...state,
        brand: action.payload,
      };

    case CONSTANTS.SET_PRODUCT_URL:
      return {
        ...state,
        productUrl: action.payload,
      };

    case CONSTANTS.SET_RECOMMENDATIONS:
      return {
        ...state,
        recommendations: {
          ...state.recommendations,
          ...action.payload,
        },
      };

    case CONSTANTS.SET_SOFT_VALIDATION:
      return {
        ...state,
        softValidation: {
          ...state.softValidation,
          ...action.payload,
        },
      };

    case CONSTANTS.SET_HARD_VALIDATION:
      return {
        ...state,
        hardValidation: {
          ...state.hardValidation,
          ...action.payload,
        },
      };

    case CONSTANTS.SET_BODY_TYPE:
      return {
        ...state,
        bodyType: action.payload,
      };

    case CONSTANTS.SET_EMAIL:
      return {
        ...state,
        email: action.payload,
      };

    case CONSTANTS.SET_FAKE_SIZE:
      return {
        ...state,
        fakeSize: action.payload,
      };

    case CONSTANTS.SET_HEADER_ICONS_STYLE:
      return {
        ...state,
        headerIconsStyle: action.payload,
      };

    case CONSTANTS.SET_CAMERA:
      return {
        ...state,
        camera: action.payload,
      };

    case CONSTANTS.SET_HELP_IS_ACTIVE:
      return {
        ...state,
        isHelpActive: action.payload,
      };

    case CONSTANTS.SET_IS_OPEN_RETURN_URL_DESKTOP:
      return {
        ...state,
        isOpenReturnUrlDesktop: action.payload,
      };

    case CONSTANTS.SET_PHONE_NUMBER:
      return {
        ...state,
        phoneNumber: action.payload,
      };

    case CONSTANTS.SET_PRODUCT_ID:
      return {
        ...state,
        productId: action.payload,
      };

    case CONSTANTS.SET_UNITS:
      return {
        ...state,
        units: action.payload,
      };

    case CONSTANTS.SET_WEIGHT:
      return {
        ...state,
        weight: action.payload,
      };

    case CONSTANTS.SET_WEIGHT_LB:
      return {
        ...state,
        weightLb: action.payload,
      };

    case CONSTANTS.SET_PROCESSING_STATUS:
      return {
        ...state,
        sendDataStatus: action.payload,
      };

    case CONSTANTS.SET_PAGE_RELOAD_STATUS:
      return {
        ...state,
        pageReloadStatus: action.payload,
      };

    case CONSTANTS.SET_FLOW_STATE:
      return {
        ...state,
        flowState: action.payload,
      };

    case CONSTANTS.SET_SETTINGS:
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload,
        },
      };

    case CONSTANTS.SET_HELP_BUTTON_STATUS:
      return {
        ...state,
        helpBtnStatus: action.payload,
      };

    case CONSTANTS.SET_IS_NETWORK:
      return {
        ...state,
        isNetwork: action.payload,
      };

    case CONSTANTS.SET_SOURCE:
      return {
        ...state,
        source: action.payload || 'widget',
      };

    case CONSTANTS.SET_MTM_CLIENT_ID:
      return {
        ...state,
        mtmClientId: action.payload,
      };

    case CONSTANTS.SET_FIRST_NAME:
      return {
        ...state,
        firstName: action.payload,
      };

    case CONSTANTS.SET_NOTES:
      return {
        ...state,
        notes: action.payload,
      };

    case CONSTANTS.SET_IS_PHOTOS_FROM_GALLERY:
      return {
        ...state,
        isPhotosFromGallery: action.payload,
      };

    case CONSTANTS.SET_PHONE_COUNTRY:
      return {
        ...state,
        phoneCountry: action.payload,
      };

    case CONSTANTS.SET_PHONE_USER_PART:
      return {
        ...state,
        phoneUserPart: action.payload,
      };

    case CONSTANTS.SET_IS_SMB_FLOW:
      return {
        ...state,
        isSmbFlow: action.payload,
      };

    default:
      return state;
  }
};

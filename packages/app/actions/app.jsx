import getDB from '@appsemble/utils/getDB';

import resolveJsonPointers from '../utils/resolveJsonPointers';

export const GET_START = 'app/GET_START';
export const GET_SUCCESS = 'app/GET_SUCCESS';
export const GET_ERROR = 'app/GET_ERROR';
const EDIT_SUCCESS = 'editor/EDIT_SUCCESS';

const initialState = {
  app: null,
  error: null,
};

export default (state = initialState, action) => {
  switch (action.type) {
    case GET_START:
      return {
        ...state,
        app: null,
        error: null,
      };
    case GET_SUCCESS:
      return {
        ...state,
        app: action.app,
        error: null,
      };
    case GET_ERROR:
      return {
        ...state,
        app: null,
        error: action.error,
      };
    case EDIT_SUCCESS:
      return {
        ...state,
        app: action.app,
      };
    default:
      return state;
  }
};

/**
 * Get the app for the app id in the base URI.
 */
export function getApp() {
  return async dispatch => {
    dispatch({
      type: GET_START,
    });
    try {
      const app = resolveJsonPointers(window.settings.app);
      const db = await getDB(app);
      dispatch({
        type: GET_SUCCESS,
        app,
        db,
      });
    } catch (error) {
      dispatch({
        type: GET_ERROR,
        error,
      });
    }
  };
}

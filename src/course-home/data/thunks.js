import { logError } from '@edx/frontend-platform/logging';
import {
  getCourseHomeCourseMetadata,
  getDatesTabData,
  getOutlineTabData,
  updateCourseDeadlines,
} from './api';

import {
  addModel,
} from '../../model-store';

import {
  fetchTabFailure,
  fetchTabRequest,
  fetchTabSuccess,
} from './slice';

export function fetchTab(courseId, tab, getTabData) {
  return async (dispatch) => {
    dispatch(fetchTabRequest({ courseId }));
    Promise.allSettled([
      getCourseHomeCourseMetadata(courseId),
      getTabData(courseId),
    ]).then(([courseHomeCourseMetadataResult, tabDataResult]) => {
      const fetchedCourseHomeCourseMetadata = courseHomeCourseMetadataResult.status === 'fulfilled';
      const fetchedTabData = tabDataResult.status === 'fulfilled';

      if (fetchedCourseHomeCourseMetadata) {
        dispatch(addModel({
          modelType: 'courses',
          model: {
            id: courseId,
            ...courseHomeCourseMetadataResult.value,
          },
        }));
      } else {
        logError(courseHomeCourseMetadataResult.reason);
      }

      if (fetchedTabData) {
        dispatch(addModel({
          modelType: tab,
          model: {
            id: courseId,
            ...tabDataResult.value,
          },
        }));
      } else {
        logError(tabDataResult.reason);
      }

      if (fetchedCourseHomeCourseMetadata && fetchedTabData) {
        dispatch(fetchTabSuccess({ courseId }));
      } else {
        dispatch(fetchTabFailure({ courseId }));
      }
    });
  };
}

export function fetchDatesTab(courseId) {
  return fetchTab(courseId, 'dates', getDatesTabData);
}

export function fetchOutlineTab(courseId) {
  return fetchTab(courseId, 'outline', getOutlineTabData);
}

export function resetDeadlines(courseId, getTabData) {
  return async (dispatch) => {
    updateCourseDeadlines(courseId).then(() => {
      dispatch(getTabData(courseId));
    });
  };
}
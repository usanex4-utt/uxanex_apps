
import { api } from '../../api/client';
import { EP } from '../../api/endpoints';

export const heartFusionApi = {
  create: (partnerId, firstHeart) =>
    api(EP.heartFusionCreate, {
      method: 'POST',
      body: {
        partner_id: partnerId,
        first_heart: firstHeart,
      },
    }),

  active: (partnerId) =>
    api(EP.heartFusionActive(partnerId)),

  getSession: (sessionId) =>
    api(EP.heartFusionSession(sessionId)),

  submitHeart: (sessionId, secondHeart) =>
    api(EP.heartFusionSubmitHeart(sessionId), {
      method: 'POST',
      body: { second_heart: secondHeart },
    }),

  start: (sessionId) =>
    api(EP.heartFusionStart(sessionId), {
      method: 'POST',
    }),

  fuse: (sessionId) =>
    api(EP.heartFusionFuse(sessionId), {
      method: 'POST',
    }),

  complete: (sessionId) =>
    api(EP.heartFusionComplete(sessionId), {
      method: 'POST',
    }),

  submitRating: (sessionId, rating) =>
    api(EP.heartFusionRating(sessionId), {
      method: 'POST',
      body: { rating },
    }),
};

export default heartFusionApi;

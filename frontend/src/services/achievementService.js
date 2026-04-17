import request from '../utils/request';

const achievementApi = {
    getAchievements: () => request.get('/achievements'),
    checkAchievements: () => request.post('/achievements/check'),
};

export default achievementApi;
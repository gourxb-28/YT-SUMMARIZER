import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, 
});

export const fetchTranscript = async (url) => {
  const response = await apiClient.post('/transcript', { url });
  return response.data;
};


export const fetchSummary = async (videoId, url) => {
  const response = await apiClient.post('/summarize', {
    video_id: videoId,
    url: url
  });
  return response.data;
};


export const sendChatMessage = async (videoId, question) => {
  const response = await apiClient.post('/chat', {
    video_id: videoId,
    question: question
  });
  return response.data;
};

export default apiClient;

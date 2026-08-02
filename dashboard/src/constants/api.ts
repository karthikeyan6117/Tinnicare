export const API_BASE_URL = "http://localhost:8000/api/v1";

export const endpoints = {
  auth: { login: "/auth/login", register: "/auth/register", me: "/auth/me", profileStatus: "/auth/profile/status", profileDetails: "/auth/profile", profileUpdate: "/auth/profile" },
  symptoms: { list: "/symptoms", create: "/symptoms" },
  triggers: { list: "/triggers", insights: "/triggers/insights" },
  chat: { history: "/chat/history", message: "/chat/message" },
  assessments: {
    risk: "/assessments/risk",
    latestRisk: "/assessments/risk/latest",
    history: "/assessments/history",
    carePlans: "/assessments/care-plans",
    createCarePlan: "/assessments/care-plans",
  },
  predictions: { predict: "/predictions", aiInsights: "/predictions/ai-insights" },
};

import { Platform } from "react-native";

const LOCALHOST_API_BASE_URL = "http://localhost:8000/api/v1";
const ANDROID_EMULATOR_API_BASE_URL = "http://10.0.2.2:8000/api/v1";

export const API_BASE_URL = Platform.OS === "android" ? ANDROID_EMULATOR_API_BASE_URL : LOCALHOST_API_BASE_URL;

export const endpoints = {
  auth: {
    login: "/auth/login",
    register: "/auth/register",
    me: "/auth/me",
    profileStatus: "/auth/profile/status",
    profileUpdate: "/auth/profile",
  },
  symptoms: {
    list: "/symptoms",
    create: "/symptoms",
    detail: (id: string) => `/symptoms/${id}`,
  },
  triggers: {
    list: "/triggers",
    create: "/triggers",
    insights: "/triggers/insights",
  },
  assessments: {
    riskHistory: "/assessments/risk",
    latestRisk: "/assessments/risk/latest",
    carePlans: "/assessments/care-plans",
    createCarePlan: "/assessments/care-plans",
    addActivity: (planId: string) => `/assessments/care-plans/${planId}/activities`,
    completeActivity: (id: string) => `/assessments/activities/${id}/complete`,
  },
  predictions: {
    predict: "/predictions",
    aiInsights: "/predictions/ai-insights",
  },
};

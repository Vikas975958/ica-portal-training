import axios from "axios";
import { api } from "./axios";
import { paymentModeRequiresReference } from "../lib/paymentReference";

const toApiResponse = (payload, fallbackMessage = "Request completed successfully") => {
  if (
    payload &&
    typeof payload === "object" &&
    ("success" in payload || "data" in payload)
  ) {
    const status = payload.status ?? payload.statusCode ?? 200;
    const isSuccess =
      payload.success !== undefined
        ? payload.success
        : status === 200 || status === 201 || payload.statusCode === 200 || payload.statusCode === 201 || true;

    return {
      success: isSuccess,
      status,
      message: payload.message ?? fallbackMessage,
      pagination: payload.pagination,
      data: payload.data,
      statusCode: payload.statusCode,
    };
  }

  return {
    success: true,
    status: 200,
    message: fallbackMessage,
    data: payload,
  };
};

// 1. Login
export const loginApi = async (credentials) => {
  const email = credentials?.email ?? credentials;
  const password = credentials?.password;
  const res = await api.post("/trainees/auth/login", { email, password });
  return toApiResponse(res.data, "Login successful");
};
export const loginUser = (email, password) => loginApi({ email, password });

// 2. Request forgot password link
export const forgotPasswordApi = async (data) => {
  const email = typeof data === "string" ? data : data?.email;
  const res = await api.post("/trainees/auth/forgot-password", { email });
  return toApiResponse(res.data, "Password reset link sent");
};
export const forgotPasswordUser = forgotPasswordApi;

// 3. Reset password using email token
export const resetPasswordApi = async (data) => {
  const token = data?.token;
  const new_password = data?.new_password;
  const res = await api.post("/trainees/auth/reset-password", { token, new_password });
  return toApiResponse(res.data, "Password reset successful");
};
export const resetPasswordUser = (token, new_password) => resetPasswordApi({ token, new_password });

// 4. Create Trainee
export const createTraineeApi = async (traineeData) => {
  try {
    const res = await api.post("/trainees/trainees", traineeData);
    return toApiResponse(res.data, "Trainee created successfully");
  } catch (error) {
    if (!axios.isAxiosError(error) || !error.response) {
      throw error;
    }
    const status = error.response.status;
    const rawMessage = error.response.data?.message || "Failed to create trainee.";
    const message = rawMessage.includes("UQ_351065dbdcad302ad92d7417a84")
      ? "A trainee with this generated ID already exists. Please check the Trainees list before trying again."
      : rawMessage;

    return {
      success: false,
      status,
      statusCode: error.response.data?.statusCode || status,
      message,
      data: undefined,
    };
  }
};
export const createTrainee = createTraineeApi;

// 5. Import Trainees from CSV or XLSX
export const importTraineesApi = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await api.post("/trainees/trainees/import", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return toApiResponse(res.data, "Trainees imported successfully");
};
export const importTrainees = importTraineesApi;

// 6. Import Transactions from CSV or XLSX
export const importTransactionsApi = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await api.post("/fee-ledger/import", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return toApiResponse(res.data, "Transactions imported successfully");
};
export const importTransactions = importTransactionsApi;

// 7. Create Trainee System User
export const createUserApi = async (userData) => {
  const res = await api.post("/trainees/users", userData);
  return toApiResponse(res.data, "User created successfully");
};
export const createTraineeUser = createUserApi;

// 8. Create Program
export const createProgramApi = async (programData) => {
  const res = await api.post("/programs", programData);
  const apiResponse = toApiResponse(res.data, "Program created successfully");
  let program = apiResponse.data;
  if (apiResponse.success && apiResponse.data && typeof apiResponse.data === "object") {
    program = apiResponse.data.program ?? apiResponse.data;
  }
  return { ...apiResponse, data: program };
};
export const createProgram = createProgramApi;

// 9. Record a new payment transaction
export const createTransactionApi = async (data) => {
  const { traineeId, ...rest } = data;
  const parsedAmount =
    typeof data.amount === "string"
      ? Number(data.amount.replace(/,/g, ""))
      : data.amount;

  let payment_date = data.payment_date || data.date;
  if (payment_date) {
    const trimmed = String(payment_date).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      payment_date = `${trimmed}T00:00:00.000Z`;
    } else {
      const cleaned = trimmed.replace(/\bSept\b/i, "Sep");
      const parsedDate = new Date(cleaned);
      if (!isNaN(parsedDate.getTime())) {
        const y = parsedDate.getFullYear();
        const m = String(parsedDate.getMonth() + 1).padStart(2, "0");
        const d = String(parsedDate.getDate()).padStart(2, "0");
        payment_date = `${y}-${m}-${d}T00:00:00.000Z`;
      }
    }
  }

  const rawTitle = (data.title || data.type || "").trim();
  let type = data.type;
  let instalment_number = data.instalment_number || data.instalmentNumber || null;

  if (rawTitle) {
    const lowerType = rawTitle.toLowerCase().replace(/[_-]+/g, " ");
    if (
      lowerType === "registration fee" ||
      lowerType === "registration_fee" ||
      lowerType === "reg fee" ||
      lowerType === "reg_fee" ||
      lowerType === "registration"
    ) {
      type = "Registration Fee";
      instalment_number = null;
    } else {
      type = "Instalment";
      if (!instalment_number) {
        const match = rawTitle.match(/(?:installment|instalment|inst)\s*(\d+)/i);
        if (match) {
          instalment_number = Number(match[1]);
        }
      }
    }
  } else {
    type = "Instalment";
  }

  const txId = data.transactionId || data.transaction_id || "";
  const paymentMode = data.payment_mode || data.mode || "";
  const payload = {
    title: rawTitle || data.title,
    type,
    instalment_number,
    amount: parsedAmount !== undefined && isNaN(Number(parsedAmount)) ? 0 : Number(parsedAmount),
    payment_mode: paymentMode,
    payment_date,
    status: data.status || "Paid",
    trainee_id: data.trainee_id || traineeId,
  };

  if (paymentModeRequiresReference(paymentMode)) {
    payload.transactionId = txId;
    payload.transaction_id = txId;
  }

  const res = await api.post("/fee-ledger", payload);
  return toApiResponse(res.data, "Payment transaction recorded successfully");
};
export const createTransaction = createTransactionApi;

// 10. Submit a new project for a trainee
export const createProjectApi = async (data) => {
  const { traineeId, trainee_id, title, repo, live, type, result } = data;
  const payload = {
    trainee_id: trainee_id || traineeId,
    title,
    code_link: repo,
    website_link: live,
    tech_stack: type,
    status: result,
  };
  const res = await api.post("/trainees/projects", payload);
  const response = toApiResponse(res.data, "Project submitted successfully");
  if (response.success && response.data) {
    const p = response.data;
    response.data = {
      ...p,
      repo: p.repo || p.code_link || "",
      live: p.live || p.website_link || "",
      type: p.type || p.tech_stack || "",
      result: p.result || p.status || "Under Review",
    };
  }
  return response;
};
export const createProject = createProjectApi;

// 11. Create Placement
export const createPlacementApi = async (data) => {
  const { traineeId, trainee_id, company, role, round, date, result } = data;

  let interview_date = date;
  if (interview_date) {
    const parsedDate = new Date(interview_date);
    if (!isNaN(parsedDate.getTime())) {
      interview_date = parsedDate.toISOString();
    }
  }

  const payload = {
    trainee_id: trainee_id || traineeId,
    company,
    role,
    round,
    interview_date,
    result,
  };
  const res = await api.post("/trainees/placements", payload);
  const response = toApiResponse(res.data, "Interview record added successfully");
  if (response.success && response.data) {
    const p = response.data;
    let formattedDate = p.date || p.interview_date || "";
    if (formattedDate) {
      const d = new Date(formattedDate);
      if (!isNaN(d.getTime())) {
        formattedDate = d.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      }
    }
    response.data = {
      ...p,
      date: formattedDate,
    };
  }
  return response;
};
export const createPlacement = createPlacementApi;

// 12. Create Note
export const createNoteApi = async (data) => {
  const { traineeId, trainee_id, text, author, initial } = data;
  const payload = {
    trainee_id: trainee_id || traineeId,
    note: text,
    author_name: author,
    initial,
  };
  const res = await api.post("/trainees/notes", payload);
  const response = toApiResponse(res.data, "Note added successfully");
  if (response.success && response.data) {
    const n = response.data;
    let noteDate = n.date || n.created_at || n.createdAt || "";
    if (noteDate && noteDate.includes("T")) {
      const d = new Date(noteDate);
      if (!isNaN(d.getTime())) {
        noteDate = d.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      }
    }
    response.data = {
      ...n,
      text: n.text || n.note || "",
      author: n.author || n.author_name || "",
      date: noteDate,
      initial: n.initial || (n.author || n.author_name || "A").charAt(0).toUpperCase(),
    };
  }
  return response;
};
export const createNote = createNoteApi;

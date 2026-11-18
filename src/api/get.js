import { api } from "./axios";

const toApiResponse = (payload, fallbackMessage = "Request completed successfully") => {
  if (
    payload &&
    typeof payload === "object" &&
    ("success" in payload || "data" in payload)
  ) {
    const status = payload.status ?? payload.statusCode ?? 200;
    const isSuccess = payload.success ?? (status >= 200 && status < 300);

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

const normalizeDateString = (val) => {
  if (!val) return "";
  const str = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  if (str.includes("T")) return str.split("T")[0];
  const cleaned = str.replace(/\bSept\b/i, "Sep");
  const d = new Date(cleaned);
  if (!isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  return str;
};

const normalizePaymentTransaction = (transaction) => {
  const rawStatus = String(transaction.status || "Paid").trim().toLowerCase();
  const status =
    rawStatus === "pending" || rawStatus === "unpaid" ? "Pending" : "Paid";

  const sourceTitle = String(transaction.title || transaction.type || "").trim();
  const lowerTitle = sourceTitle.toLowerCase().replace(/[_-]+/g, " ");
  const instalmentNumber = Number(
    transaction.instalment_number ?? transaction.installment_number,
  );
  let title = sourceTitle;
  if (
    lowerTitle === "registration fee" ||
    lowerTitle === "reg fee" ||
    lowerTitle === "registration"
  ) {
    title = "Registration Fee";
  } else if (Number.isInteger(instalmentNumber) && instalmentNumber > 0) {
    title = `Installment ${instalmentNumber}`;
  } else {
    const match = lowerTitle.match(/(?:installment|instalment|inst)\s*(\d+)/i);
    if (match) title = `Installment ${match[1]}`;
  }
  const rawDate = transaction.date || transaction.payment_date || "";
  return {
    ...transaction,
    title: title || "Transaction",
    amount: transaction.amount ?? 0,
    mode: transaction.mode || transaction.payment_mode || "",
    date: normalizeDateString(rawDate),
    transactionId:
      transaction.transactionId || transaction.transaction_id || "",
    status,
  };
};

// 1. Get Trainee User by ID
export const getUserByIdApi = async (id) => {
  const res = await api.get(`/trainees/users/${id}`);
  return toApiResponse(res.data, "User details retrieved successfully");
};
export const getUserById = getUserByIdApi;

// 2. Get All Trainee Users
export const getUsersApi = async (params) => {
  const query = typeof params === "string" ? params : params ? new URLSearchParams(params).toString() : "";
  const url = query ? `/trainees/users?${query}` : "/trainees/users";
  const res = await api.get(url);
  return toApiResponse(res.data, "Users list retrieved successfully");
};
export const getAllUsers = getUsersApi;

// 3. Get All Trainees
export const getTraineesApi = async (params) => {
  const query = typeof params === "string" ? params : params ? new URLSearchParams(params).toString() : "";
  const url = query ? `/trainees/trainees?${query}` : "/trainees/trainees";
  const res = await api.get(url);
  return toApiResponse(res.data, "Trainees list retrieved successfully");
};
export const getAllTrainees = getTraineesApi;

// 4. Get Trainee by ID
export const getTraineeByIdApi = async (id) => {
  const res = await api.get(`/trainees/trainees/${id}`);
  return toApiResponse(res.data, "Trainee details retrieved successfully");
};
export const getTraineeById = getTraineeByIdApi;

// 5. Get Trainee by Email
export const getTraineeByEmailApi = async (email) => {
  const res = await api.get("/trainees/trainees/by-email", { params: { email } });
  return toApiResponse(res.data, "Trainee details retrieved successfully");
};
export const getTraineeByEmail = getTraineeByEmailApi;

// 6. Get Programs
export const getProgramsApi = async (params, signal) => {
  const config = { signal };
  if (typeof params === "string") {
    const url = params ? `/programs?${params}` : "/programs";
    const res = await api.get(url, config);
    return toApiResponse(res.data, "Programs list retrieved successfully");
  } else {
    config.params = params;
    const res = await api.get("/programs", config);
    return toApiResponse(res.data, "Programs list retrieved successfully");
  }
};
export const getAllPrograms = getProgramsApi;

// 7. Get Program Tags
export const getProgramTagsApi = async (signal) => {
  const res = await api.get("/programs/tags", { signal });
  const apiResponse = toApiResponse(res.data, "Program tags retrieved successfully");
  let tags = [];
  if (apiResponse.success && apiResponse.data) {
    if (Array.isArray(apiResponse.data)) {
      tags = apiResponse.data;
    } else if (typeof apiResponse.data === "object" && Array.isArray(apiResponse.data.tags)) {
      tags = apiResponse.data.tags;
    }
  }
  return { ...apiResponse, data: tags };
};
export const getAllProgramTags = getProgramTagsApi;

// 8. Get Fee Ledgers
export const getFeeLedgersApi = async (params) => {
  const query = typeof params === "string" ? params : params ? new URLSearchParams(params).toString() : "";
  const url = query ? `/fee-ledger?${query}` : "/fee-ledger";
  const res = await api.get(url);
  return toApiResponse(res.data, "Fee ledgers retrieved successfully");
};
export const getFeeLedgers = getFeeLedgersApi;

// 9. Get Transactions by Trainee ID
export const getTransactionsByTraineeApi = async (traineeId) => {
  const res = await api.get(`/fee-ledger/by-trainee/${traineeId}`);
  const response = toApiResponse(res.data, "Transactions retrieved successfully");
  if (response.success && response.data) {
    const raw = response.data;
    if (!raw.summary) {
      throw new Error("Fee ledger response is missing summary data");
    }
    const list = Array.isArray(raw.transactions) ? raw.transactions : [];
    response.data = {
      summary: raw.summary,
      transactions: list.map(normalizePaymentTransaction),
      registration_fee_amount:
        raw.trainee?.registration_fee_amount !== undefined
          ? Number(raw.trainee.registration_fee_amount)
          : undefined,
      payment_mode: raw.trainee?.payment_mode,
      transaction_id: raw.trainee?.transaction_id,
      date_of_registration: raw.trainee?.date_of_registration,
    };
  }
  return response;
};
export const getTransactionsByTrainee = getTransactionsByTraineeApi;

// 10. Get Single Transaction by ID
export const getTransactionByIdApi = async (id) => {
  const res = await api.get(`/fee-ledger/${id}`);
  const response = toApiResponse(res.data, "Transaction details retrieved successfully");
  if (response.success && response.data) {
    response.data = normalizePaymentTransaction(response.data);
  }
  return response;
};
export const getTransactionById = getTransactionByIdApi;

// 11. Get Projects by Trainee ID
export const getProjectsByTraineeApi = async (traineeId) => {
  const res = await api.get(`/trainees/projects/by-trainee/${traineeId}`);
  const response = toApiResponse(res.data, "Projects retrieved successfully");
  if (response.success && response.data) {
    const raw = response.data;
    const list = Array.isArray(raw)
      ? raw
      : raw.projects || Object.values(raw).find(Array.isArray) || [];
    response.data = list.map((p) => ({
      ...p,
      repo: p.repo || p.code_link || "",
      live: p.live || p.website_link || "",
      type: p.type || p.tech_stack || "",
      result: p.result || p.status || "Under Review",
    }));
  }
  return response;
};
export const getProjectsByTrainee = getProjectsByTraineeApi;

// 12. Get Single Project by ID
export const getProjectByIdApi = async (id) => {
  const res = await api.get(`/trainees/projects/${id}`);
  const response = toApiResponse(res.data, "Project details retrieved successfully");
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
export const getProjectById = getProjectByIdApi;

// 13. Get Placements by Trainee ID
export const getPlacementsByTraineeApi = async (traineeId) => {
  const res = await api.get(`/trainees/placements/by-trainee/${traineeId}`);
  const response = toApiResponse(res.data, "Placements retrieved successfully");
  if (response.success && response.data) {
    const raw = response.data;
    const list = Array.isArray(raw)
      ? raw
      : raw.rounds || Object.values(raw).find(Array.isArray) || [];
    response.data = list.map((p) => {
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
      return {
        ...p,
        date: formattedDate,
      };
    });
  }
  return response;
};
export const getPlacementsByTrainee = getPlacementsByTraineeApi;

// 14. Get Single Placement by ID
export const getPlacementByIdApi = async (id) => {
  const res = await api.get(`/trainees/placements/${id}`);
  const response = toApiResponse(res.data, "Placement details retrieved successfully");
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
export const getPlacementById = getPlacementByIdApi;

// 15. Get Notes by Trainee ID
export const getNotesByTraineeApi = async (traineeId) => {
  const res = await api.get(`/trainees/notes/by-trainee/${traineeId}`);
  const response = toApiResponse(res.data, "Notes retrieved successfully");
  if (response.success && response.data) {
    const raw = response.data;
    const list = Array.isArray(raw)
      ? raw
      : raw.notes || Object.values(raw).find(Array.isArray) || [];
    response.data = list.map((n) => {
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
      return {
        ...n,
        text: n.text || n.note || "",
        author: n.author || n.author_name || "",
        date: noteDate,
        initial: n.initial || (n.author || n.author_name || "A").charAt(0).toUpperCase(),
      };
    });
  }
  return response;
};
export const getNotesByTrainee = getNotesByTraineeApi;

// 16. Get Single Note by ID
export const getNoteByIdApi = async (id) => {
  const res = await api.get(`/trainees/notes/${id}`);
  const response = toApiResponse(res.data, "Note details retrieved successfully");
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
export const getNoteById = getNoteByIdApi;

// 17. Download Templates
export const downloadTraineeTemplateApi = async () => {
  const res = await api.get("/trainees/trainees/import/template", {
    responseType: "blob",
  });
  return res.data;
};
export const downloadTraineeTemplate = downloadTraineeTemplateApi;

export const downloadTransactionsTemplateApi = async () => {
  const res = await api.get("/fee-ledger/import/template", {
    responseType: "blob",
  });
  return res.data;
};
export const downloadTransactionsTemplate = downloadTransactionsTemplateApi;

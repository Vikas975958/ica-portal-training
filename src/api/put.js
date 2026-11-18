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

// 1. Update Trainee User details (PUT)
export const updateUserApi = async ({ id, ...userData }) => {
  const targetId = id || userData?.id;
  const res = await api.put(`/trainees/users/${targetId}`, userData);
  return toApiResponse(res.data, "User updated successfully");
};
export const updateTraineeUser = (id, userData) => updateUserApi({ id, ...userData });

// 2. Update own password (PUT)
export const changePasswordApi = async (passwordData) => {
  const res = await api.put("/trainees/users/change-password", passwordData);
  return toApiResponse(res.data, "Password changed successfully");
};
export const changePasswordUser = changePasswordApi;

// 3. Update Trainee details (PUT)
export const updateTraineeApi = async ({ id, ...traineeData }) => {
  const targetId = id || traineeData?.id;
  const res = await api.put(`/trainees/trainees/${targetId}`, traineeData);
  return toApiResponse(res.data, "Trainee updated successfully");
};
export const updateTrainee = (id, traineeData) => updateTraineeApi({ id, ...traineeData });

// 4. Update Trainee status (PUT)
export const updateTraineeStatusApi = async ({ id, status }) => {
  const res = await api.put(`/trainees/trainees/${id}/status`, {}, { params: { status } });
  return toApiResponse(res.data, "Trainee status updated successfully");
};
export const updateTraineeStatus = (id, status) => updateTraineeStatusApi({ id, status });

// 5. Update Program
export const updateProgramApi = async ({ id, ...input }) => {
  const targetId = id || input?.id;
  const res = await api.put(`/programs/${targetId}`, input);
  const apiResponse = toApiResponse(res.data, "Program updated successfully");
  let program = apiResponse.data;
  if (apiResponse.success && apiResponse.data && typeof apiResponse.data === "object") {
    program = apiResponse.data.program ?? apiResponse.data;
  }
  return { ...apiResponse, data: program };
};
export const updateProgram = (id, input) => {
  if (typeof id === "object" && id !== null && !input) {
    return updateProgramApi(id);
  }
  return updateProgramApi({ id, ...input });
};

// 6. Toggle Program Status
export const toggleProgramStatusApi = async (id) => {
  const targetId = typeof id === "object" && id !== null ? (id.id || id) : id;
  const res = await api.put(`/programs/${targetId}/toggle-status`);
  const apiResponse = toApiResponse(res.data, "Program status toggled successfully");
  let program = apiResponse.data;
  if (apiResponse.success && apiResponse.data && typeof apiResponse.data === "object") {
    program = apiResponse.data.program ?? apiResponse.data;
  }
  return { ...apiResponse, data: program };
};
export const toggleProgramStatus = toggleProgramStatusApi;

// 7. Update payment transaction details (PUT)
export const updateTransactionApi = async ({ id, ...data }) => {
  const targetId = id || data?.id;
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
  }

  const txId = data.transactionId || data.transaction_id || "";
  const paymentMode = data.payment_mode || data.mode || "";
  const payload = {
    amount: parsedAmount !== undefined && isNaN(Number(parsedAmount)) ? 0 : Number(parsedAmount),
    payment_mode: paymentMode,
    payment_date,
    status: data.status || "Paid",
  };

  if (rawTitle) {
    payload.title = rawTitle;
  }
  if (type) {
    payload.type = type;
  }
  if (instalment_number !== null) {
    payload.instalment_number = instalment_number;
  }
  if (paymentModeRequiresReference(paymentMode)) {
    payload.transactionId = txId;
    payload.transaction_id = txId;
  }

  const res = await api.put(`/fee-ledger/${targetId}`, payload);
  return toApiResponse(res.data, "Transaction updated successfully");
};
export const updateTransaction = (id, data) => updateTransactionApi({ id, ...data });

// 8. Update Project (PUT)
export const updateProjectApi = async ({ id, ...data }) => {
  const targetId = id || data?.id;
  const { traineeId, trainee_id, title, repo, live, type, result } = data;
  const payload = {
    trainee_id: trainee_id || traineeId,
    title,
    code_link: repo,
    website_link: live,
    tech_stack: type,
    status: result,
  };
  const res = await api.put(`/trainees/projects/${targetId}`, payload);
  const response = toApiResponse(res.data, "Project updated successfully");
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
export const updateProject = (id, data) => updateProjectApi({ id, ...data });

// 9. Update Placement (PUT)
export const updatePlacementApi = async ({ id, ...data }) => {
  const targetId = id || data?.id;
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
  const res = await api.put(`/trainees/placements/${targetId}`, payload);
  const response = toApiResponse(res.data, "Interview record updated successfully");
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
export const updatePlacement = (id, data) => updatePlacementApi({ id, ...data });

// 10. Update Note (PUT)
export const updateNoteApi = async ({ id, ...data }) => {
  const targetId = id || data?.id;
  const { traineeId, trainee_id, text, author, initial } = data;
  const payload = {
    trainee_id: trainee_id || traineeId,
    note: text,
    author_name: author,
    initial,
  };
  const res = await api.put(`/trainees/notes/${targetId}`, payload);
  const response = toApiResponse(res.data, "Note edited successfully");
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
export const updateNote = (id, data) => updateNoteApi({ id, ...data });

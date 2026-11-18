import { cookies } from "next/headers";

export async function fetchServerTrainee(id) {
  let token;

  try {
    const cookieStore = await cookies();
    token = cookieStore.get("accessToken")?.value;
  } catch (err) {
    console.error("fetchServerTrainee cookie error:", err);
  }

  if (!token) return null;

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      console.warn(
        "NEXT_PUBLIC_API_URL is not defined. Please check your .env file and restart the Next.js server."
      );
      return null;
    }

    const headers = { Authorization: `Bearer ${token}` };

    const res = await fetch(`${apiUrl}/trainees/trainees/${id}`, {
      headers,
      next: { revalidate: 0 },
    });

    if (!res.ok) return null;

    const envelope = await res.json();
    const trainee = envelope.data;

    if (!trainee) return null;

    let programName =
      trainee.program?.name ||
      trainee.program?.title ||
      trainee.program_name ||
      "";
    let programDuration =
      trainee.program?.duration || trainee.program_duration || "";

    if (!programName && trainee.program_id) {
      try {
        const progRes = await fetch(`${apiUrl}/programs/${trainee.program_id}`, {
          headers,
          next: { revalidate: 60 },
        });
        if (progRes.ok) {
          const progEnvelope = await progRes.json();
          const prog =
            progEnvelope.data?.program ||
            progEnvelope.data ||
            progEnvelope.program ||
            progEnvelope;
          programName = prog.name || prog.title || programName;
          programDuration = prog.duration || programDuration;
        }
      } catch (progErr) {
        console.warn("fetchServerTrainee: could not fetch program details:", progErr);
      }
    }

    const code = trainee.trainee_code ? String(trainee.trainee_code) : trainee.id;
    return {
      id: trainee.id,
      traineeCode: code,
      name: `${trainee.first_name || ""} ${trainee.last_name || ""}`.trim(),
      email: trainee.email || "",
      phone: trainee.phone || "",
      registrationDate:
        trainee.date_of_registration ||
        trainee.created_at ||
        trainee.createdAt ||
        "",
      gender: trainee.gender || "Other",
      addressLine: trainee.flat_house_number || "",
      addressDetail: `${trainee.street_address || ""}, ${trainee.city || ""}, ${trainee.state || ""} ${trainee.pin_code || ""}`,
      addressStreet: trainee.street_address || "",
      addressCity: trainee.city || "",
      addressState: trainee.state || "",
      addressPinCode: trainee.pin_code || "",
      status: trainee.status || "Enrolled",
      emergencyName:
        `${trainee.emergency_contact?.first_name || ""} ${trainee.emergency_contact?.last_name || ""}`.trim() ||
        "Emergency Contact",
      emergencyRelationship: trainee.emergency_contact?.relationship || "Contact",
      emergencyPhone: trainee.emergency_contact?.phone || "",
      programName,
      programId: trainee.program_id || trainee.program?.id || "",
      programDuration,
      numberOfInstallments: Number(
        trainee.number_of_instalments ?? trainee.number_of_installments ?? 4
      ),
      paymentMode: trainee.payment_mode || "UPI",
      qualifications: (trainee.qualifications || []).map((q) => ({
        degree: q.qualification || q.degree || "",
        college: q.institution_name || q.college || "",
        sessionStart:
          q.start_date ||
          q.sessionStart ||
          (q.duration ? q.duration.split(" - ")[0] : "July 2022"),
        sessionEnd:
          q.completion_date ||
          q.sessionEnd ||
          (q.duration ? q.duration.split(" - ")[1] : "May 2026"),
      })),
      projects: [],
      fees: {
        total: String(trainee.total_fees || 0),
        discount: String(trainee.scholarship_discount || 0),
        payable: String(trainee.payable_amount || 0),
        balanceDue: String(
          Math.max(
            0,
            (trainee.payable_amount || 0) -
              (trainee.registration_fee_amount || 0)
          )
        ),
        paidAmount: String(trainee.registration_fee_amount || 0),
        completionPercent: trainee.payable_amount
          ? Math.round(
              ((trainee.registration_fee_amount || 0) /
                trainee.payable_amount) *
                100
            )
          : 0,
        transactions: [
          {
            title: "Registration Fee",
            amount: String(trainee.registration_fee_amount || 0),
            mode: trainee.payment_mode || "UPI",
            date:
              trainee.payment_date || trainee.date_of_registration || "",
            transactionId: trainee.transaction_id || "",
            status: "Paid",
          },
        ],
        remarks:
          trainee.remark ||
          trainee.remarks ||
          trainee.fee_remark ||
          trainee.fee_remarks ||
          "",
      },
      remark:
        trainee.remark ||
        trainee.remarks ||
        trainee.fee_remark ||
        trainee.fee_remarks ||
        "",
      placement: {
        currentCompany: "",
        currentRole: "",
        currentStatus: "On Hold",
        rounds: [],
      },
      notes: [],
    };
  } catch (err) {
    console.error("fetchServerTrainee API error:", err);
    return null;
  }
}

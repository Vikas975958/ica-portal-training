export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role: string;
  permissions: string[];
  status: string; // "Active" | "Inactive"
  avatarBg: string;
  initial: string;
}

export const availablePermissions = [
  "Dashboard",
  "Trainees",
  "Transaction",
  "Program",
  "User",
];

export const tailwindAvatarBgs = [
  "bg-purple-100 text-purple-700",
  "bg-emerald-100 text-emerald-700",
  "bg-blue-100 text-blue-700",
  "bg-pink-100 text-pink-700",
  "bg-cyan-100 text-cyan-700",
  "bg-orange-100 text-orange-700",
  "bg-indigo-100 text-indigo-700",
];

export const initialUsers: User[] = [
  {
    id: "1",
    firstName: "Robert",
    lastName: "Fox",
    email: "sara.cruz@example.com",
    password: "Password123",
    role: "Superadmin",
    permissions: ["Dashboard", "Trainees", "Transaction", "Program", "User"],
    status: "Active",
    avatarBg: "bg-purple-100 text-purple-700",
    initial: "R",
  },
  {
    id: "2",
    firstName: "Annette",
    lastName: "Black",
    email: "alma.lawson@example.com",
    password: "SecurePass56",
    role: "Admin",
    permissions: ["Dashboard", "Trainees", "Transaction", "Program", "User"],
    status: "Active",
    avatarBg: "bg-emerald-100 text-emerald-700",
    initial: "A",
  },
  {
    id: "3",
    firstName: "Ralph",
    lastName: "Edwards",
    email: "tim.jennings@example.com",
    password: "EdwardsTim9",
    role: "Admin",
    permissions: ["Dashboard", "Trainees", "Program"],
    status: "Active",
    avatarBg: "bg-blue-100 text-blue-700",
    initial: "R",
  },
  {
    id: "4",
    firstName: "Wade",
    lastName: "Warren",
    email: "debbie.baker@example.com",
    password: "WadeWarren88",
    role: "Admin",
    permissions: ["Dashboard", "Transaction", "Program"],
    status: "Active",
    avatarBg: "bg-pink-100 text-pink-700",
    initial: "W",
  },
  {
    id: "5",
    firstName: "Esther",
    lastName: "Howard",
    email: "kenzi.lawson@example.com",
    password: "EstherHow1",
    role: "Admin",
    permissions: ["Dashboard", "Transaction"],
    status: "Active",
    avatarBg: "bg-cyan-100 text-cyan-700",
    initial: "E",
  },
  {
    id: "6",
    firstName: "Darlene",
    lastName: "Robertson",
    email: "nevaeh.simmons@example.com",
    password: "SimmonsDar99",
    role: "Admin",
    permissions: ["Dashboard", "Trainees", "Transaction", "Program"],
    status: "Inactive",
    avatarBg: "bg-orange-100 text-orange-700",
    initial: "D",
  },
  {
    id: "7",
    firstName: "Kristin",
    lastName: "Watson",
    email: "kristin.watson@example.com",
    password: "KristinPass77",
    role: "Admin",
    permissions: ["Dashboard", "Trainees", "User"],
    status: "Active",
    avatarBg: "bg-indigo-100 text-indigo-700",
    initial: "K",
  },
  {
    id: "8",
    firstName: "Courtney",
    lastName: "Henry",
    email: "courtney.henry@example.com",
    password: "CourtneyH88",
    role: "Admin",
    permissions: ["Dashboard", "Transaction", "User"],
    status: "Active",
    avatarBg: "bg-purple-100 text-purple-700",
    initial: "C",
  },
  {
    id: "9",
    firstName: "Theresa",
    lastName: "Webb",
    email: "theresa.webb@example.com",
    password: "TheresaW99",
    role: "Admin",
    permissions: ["Dashboard", "Trainees", "Program"],
    status: "Inactive",
    avatarBg: "bg-emerald-100 text-emerald-700",
    initial: "T",
  },
  {
    id: "10",
    firstName: "Floyd",
    lastName: "Miles",
    email: "floyd.miles@example.com",
    password: "FloydMiles10",
    role: "Admin",
    permissions: ["Dashboard", "Trainees", "Transaction", "Program", "User"],
    status: "Active",
    avatarBg: "bg-cyan-100 text-cyan-700",
    initial: "F",
  },
];


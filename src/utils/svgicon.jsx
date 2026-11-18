import sidebar1 from "../assets/sidebar1.svg";
import sidebar2 from "../assets/sidebar2.svg";
import sidebar3 from "../assets/sidebar3.svg";
import sidebar4 from "../assets/sidebar4.svg";
import sidebar5 from "../assets/sidebar5.svg";
import collapse from "../assets/collapse.svg";
import holdIcon from "../assets/holdIcon.svg";
import EditIcon from "../assets/EditIcon.svg";
import deleteIcon from "../assets/deleteIcon.svg";
import Calendar from "../assets/Calendar.svg";
import mobilemenu from "../assets/mobilemenu.svg";
import documentupload from "../assets/documentupload.svg";

const getAssetSrc = (asset) =>
  typeof asset === "string" ? asset : asset?.src || asset;

const IconImage = ({ src, className, style }) => (
  <img
    src={getAssetSrc(src)}
    alt=""
    aria-hidden
    className={className ?? "h-4.5 w-4.5 shrink-0 object-contain"}
    style={style}
  />
);

export const sidebar1Icon = ({ className }) => (
  <IconImage src={sidebar1} className={className} />
);

export const sidebar2Icon = ({ className }) => (
  <IconImage src={sidebar2} className={className} />
);

export const sidebar3Icon = ({ className }) => (
  <IconImage src={sidebar3} className={className} />
);

export const sidebar4Icon = ({ className }) => (
  <IconImage src={sidebar4} className={className} />
);

export const sidebar5Icon = ({ className }) => (
  <IconImage src={sidebar5} className={className} />
);

export const collapseIcon = ({ className }) => (
  <IconImage src={collapse} className={className} />
);
export const HoldIconsvg = ({ className }) => (
  <IconImage src={holdIcon} className={className} />
);
export const EditIconsvg = ({ className }) => (
  <IconImage src={EditIcon} className={className} />
);
export const DeleteIconsvg = ({ className }) => (
  <IconImage src={deleteIcon} className={className} />
);

export const ArrowupIcon = ({ className, style }) => (
  <svg 
    width="10" 
    height="6" 
    viewBox="0 0 10 6" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
    style={style}
  >
    <path d="M9.42871 5.14286L4.71443 4.12136e-07L0.00014019 5.14286L9.42871 5.14286Z" fill="currentColor" />
  </svg>
);

export const ArrowdownIcon = ({ className, style }) => (
  <svg 
    width="10" 
    height="6" 
    viewBox="0 0 10 6" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
    style={style}
  >
    <path d="M0 0L4.71429 5.14286L9.42857 0H0Z" fill="currentColor" />
  </svg>
);

export const SortIcon = ({ className, sortOrder }) => (
  <span className={className ?? "inline-flex flex-col items-center justify-center gap-[2px] shrink-0 ml-1.5 align-middle"}>
    <ArrowupIcon className={`w-2 h-1.5 transition-colors ${sortOrder === "asc" ? "text-[#ff5b21]" : "text-[#a3a3a3]"}`} />
    <ArrowdownIcon className={`w-2 h-1.5 transition-colors ${sortOrder === "desc" || sortOrder === undefined ? "text-[#ff5b21]" : "text-[#a3a3a3]"}`} />
  </span>
);

export const CalendarIcon = ({ className }) => (
  <IconImage src={Calendar} className={className} />
);

export const MobilemenuIcon = ({ className }) => (
  <IconImage src={mobilemenu} className={className} />
);
export const DocumentuploadIcon = ({ className }) => (
  <IconImage src={documentupload} className={className} />
);

import type { JSX } from "react";

interface EditableTextProps {
  label?: string;
  field: string;
  placeholder?: string;
  editData: any;
  setEditData: (data: any) => void;
  client: any;
  isEditing: boolean;
}

export const EditableText = ({
  label,
  field,
  placeholder,
  editData,
  setEditData,
  client,
  isEditing,
}: EditableTextProps) => {
  return (
    <p>
      {label && <strong>{label} </strong>}
      {isEditing ? (
        <input
          value={editData[field] ?? ""}
          onChange={(e) => setEditData({ ...editData, [field]: e.target.value })}
          placeholder={placeholder}
          style={{ width: "100%" }}
        />
      ) : (
        (client[field] ?? "–")
      )}
    </p>
  );
};

interface EditableTextareaProps {
  label?: string;
  field: string;
  placeholder?: string;
  editData: any;
  setEditData: (data: any) => void;
  client: any;
  isEditing: boolean;
}

export const EditableTextarea = ({
  label,
  field,
  placeholder,
  editData,
  setEditData,
  client,
  isEditing,
}: EditableTextareaProps) => {
  return (
    <div>
      {label && <strong>{label}</strong>}
      {isEditing ? (
        <textarea
          value={editData[field] ?? ""}
          onChange={(e) => setEditData({ ...editData, [field]: e.target.value })}
          placeholder={placeholder}
          style={{ width: "100%", minHeight: 80 }}
        />
      ) : (
        <p style={{ whiteSpace: "pre-line" }}>{client[field] ?? "–"}</p>
      )}
    </div>
  );
};

interface EditableCSVProps {
  label?: string;
  field: string;
  editData: any;
  setEditData: (data: any) => void;
  client: any;
  isEditing: boolean;
  renderList: (value: any[]) => JSX.Element;
}

export const EditableCSV = ({
  label,
  field,
  editData,
  setEditData,
  client,
  isEditing,
  renderList,
}: EditableCSVProps) => (
  <div>
    {label && <strong>{label}</strong>}
    {isEditing ? (
      <input
        value={editData[field] ?? ""}
        onChange={(e) => setEditData({ ...editData, [field]: e.target.value })}
        placeholder="Komma gescheiden items"
        style={{ width: "100%" }}
      />
    ) : (
      renderList(client[field])
    )}
  </div>
);
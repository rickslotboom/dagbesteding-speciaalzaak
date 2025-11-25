import { useState } from "react";
import { doc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "../firebase";

export function useClientDocuments(clientId: string | undefined, setClient: any) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
  };

  const uploadDocument = async () => {
    if (!clientId || !selectedFile) {
      alert("Selecteer eerst een bestand.");
      return;
    }

    try {
      const fileRef = ref(storage, `clients/${clientId}/documents/${selectedFile.name}`);
      await uploadBytes(fileRef, selectedFile);
      const url = await getDownloadURL(fileRef);

      await updateDoc(doc(db, "clients", clientId), {
        documents: arrayUnion({
          name: selectedFile.name,
          url,
          createdAt: new Date().toISOString(),
        }),
      });

      setClient((prev: any) => ({
        ...prev,
        documents: [...(prev.documents || []), { name: selectedFile.name, url }],
      }));

      setSelectedFile(null);
      alert("Document geüpload!");
    } catch (err: any) {
      console.error("Upload fout:", err);
      alert("Upload fout: " + err?.message);
    }
  };

  const deleteDocument = async (docItem: any) => {
    if (!clientId) return;
    if (!confirm(`Weet je zeker dat je ${docItem.name} wilt verwijderen?`)) return;

    try {
      const fileRef = ref(storage, `clients/${clientId}/documents/${docItem.name}`);
      await deleteObject(fileRef);

      await updateDoc(doc(db, "clients", clientId), {
        documents: arrayRemove(docItem),
      });

      setClient((prev: any) => ({
        ...prev,
        documents: prev.documents.filter((d: any) => d.name !== docItem.name),
      }));

      alert("Document verwijderd!");
    } catch (err: any) {
      console.error("Delete fout:", err);
      alert("Verwijderen mislukt: " + (err?.message || err));
    }
  };

  return {
    selectedFile,
    handleFileSelect,
    uploadDocument,
    deleteDocument,
  };
}
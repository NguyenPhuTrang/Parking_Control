import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../auth/auth";

export default function useConfirmLogout() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const askLogout = () => setOpen(true);
  const cancel = () => setOpen(false);

  const confirm = async () => {
    try {
      setLoading(true);
      logout();
      navigate("/login", { replace: true });
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return { open, loading, askLogout, cancel, confirm };
}

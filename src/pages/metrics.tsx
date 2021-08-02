import { useAuth } from "../context/AuthContext";
import { setupAPIClient } from "../services/api";
import { withSSRAuth } from "../utils/withSSRAuth";
import decode from "jwt-decode";

export default function Metrics() {
  const { user } = useAuth();

  return (
    <>
      <h1>Metricas</h1>
      <p>Seja bem vindo {user?.email}</p>
    </>
  );
}

export const getServerSideProps = withSSRAuth(
  async (ctx) => {
    const apiClient = setupAPIClient(ctx);
    const response = await apiClient.get("/me");

    return {
      props: {},
    };
  },
  {
    permissions: ["metrics.list"],
    roles: ["administrator"],
  }
);

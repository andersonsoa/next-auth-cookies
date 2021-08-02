import { Can } from "../components/Can";
import { useAuth } from "../context/AuthContext";
import { setupAPIClient } from "../services/api";
import { withSSRAuth } from "../utils/withSSRAuth";

export default function Dashboard() {
  const { user, signOut } = useAuth();

  return (
    <>
      <h1>Dashboard</h1>
      <p>Seja bem vindo {user?.email}</p>
      <button onClick={signOut}>Sign out</button>

      <Can permissions={["metrics.list"]}>
        <div>
          <h3>Metrics</h3>
          <p>Metricas do dashboard</p>
        </div>
      </Can>
    </>
  );
}

export const getServerSideProps = withSSRAuth(async (ctx) => {
  return {
    props: {},
  };
});

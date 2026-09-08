import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/store/auth";
import { Chargement } from "@/components/ui/primitives";

/**
 * Garde de navigation.
 *
 * Important : ceci relève de l'ergonomie, pas de la sécurité. Tout le code
 * du front est public et modifiable par l'utilisateur ; la seule protection
 * réelle est celle du serveur, qui revérifie l'authentification et le rôle
 * à chaque requête. Cette garde évite simplement d'afficher une page vide ou
 * une cascade d'erreurs 401 à qui n'a rien à y faire.
 */
export default function RouteProtegee({
  children,
  adminRequis = false,
}: {
  children: React.ReactNode;
  adminRequis?: boolean;
}) {
  const { utilisateur, chargement } = useAuth();
  const emplacement = useLocation();

  // Sans cette attente, un rechargement de page redirigerait vers /login
  // avant même que la session n'ait été vérifiée.
  if (chargement) return <Chargement message="Vérification de la session…" />;

  if (!utilisateur) {
    // On mémorise la destination pour y revenir après connexion.
    return (
      <Navigate
        to={adminRequis ? "/adminlog" : "/login"}
        state={{ depuis: emplacement.pathname }}
        replace
      />
    );
  }

  if (adminRequis && utilisateur.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

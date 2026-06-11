import { useEffect } from "react";
import { useNavigate } from "react-router-dom"

const withAuth = (WrappedComponent ) => {
    const AuthComponent = (props) => {
        const router = useNavigate();

        const isAuthenticated = () => {
            if(localStorage.getItem("token")) {
                return true;
            } 
            return false;
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
        useEffect(() => {
            if(!isAuthenticated()) {
                router("/auth")
            }
        }, [])

        return <WrappedComponent {...props} />
    }

    return AuthComponent;
}

export default withAuth;
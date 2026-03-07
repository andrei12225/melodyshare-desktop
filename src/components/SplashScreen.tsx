import Logo from "./Logo.tsx";
import {AiOutlineLoading} from "react-icons/ai";

export default function SplashScreen() {
    return (
        <main className={"flex items-center justify-center min-h-screen"}>
            <div className={"flex flex-col items-center gap-5"}>
                <Logo />
                <p className={"text-white"}>Now loading...</p>
                <AiOutlineLoading className={"animate-spin text-purple-900 text-4xl"}/>
            </div>
        </main>
    )
}
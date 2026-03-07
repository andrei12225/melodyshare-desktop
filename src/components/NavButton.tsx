import {ReactNode} from "react";

export default function NavButton({text, icon, onClick}: {text: string, icon?: ReactNode, onClick?: () => any}) {
    return (
        <div onClick={onClick}
            className="flex items-center gap-2 text-white rounded-full transition-transform hover:scale-105 hover:cursor-pointer"
        >
            {icon}
            <span>{text}</span>
        </div>
    );
}
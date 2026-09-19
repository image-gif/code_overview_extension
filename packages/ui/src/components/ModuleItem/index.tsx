import { useState } from "preact/hooks";
import type { StructItem, SymbolItem } from "../../types";
import ArrowIcon from "../Icon/arrow";
import "./index.css";
import Modules from "../Modules";
import { useVscodeContext } from "../../context";



type ModuleItemProps = {
  data: SymbolItem;
}



export default function ModuleItem({ data }: ModuleItemProps) {
  const [expand, setExpand] = useState(true);
  const vscode = useVscodeContext();

  const handleClick = (child: StructItem) => {
    vscode.postMessage({ command: 'gotoTarget', location: child.location });
  }

  const handleTitleClick = () => {
    setExpand(!expand);
  }

  return (
    <>
      <div class="code-overview-module-item_title" onClick={handleTitleClick}>
        <ArrowIcon className={`code-overview-module-item_title-icon ${expand ? "" : "code-overview-module-item_title-icon-close"}`} />
        {data.label}
      </div>
      <div className={`code-overview-module-item_children ${expand ? "" : "code-overview-module-item_children-close"}`}>
        <ul className="code-overview-module-item_children-inner">
          {
            data.children.map(child => (
              <li className="code-overview-module-item_children-item" key={child.name}>
                <div onClick={() => handleClick(child)} className="code-overview-module-item_children-item-label">{child.name}</div>
                {Array.isArray(child.children) && (<Modules symbols={child.children} />)}
              </li>
            ))
          }
        </ul>
      </div>

    </>
  )
}
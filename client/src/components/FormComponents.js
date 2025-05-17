import React, { useState, useEffect } from 'react';
import "../stylesheets/forms.css"; 


export function TextBox ({placeholder = "Enter Text...", multiline = false, maxchars = null, required = true, name, value, onChange}){
    const [text, setText] = useState("");

    const handleChange = (e) => {
      if (onChange) onChange(e);
      else setText(e.target.value);
    };

    const controlledValue = value !== undefined ? value : text;

    useEffect(() => {
      if (value !== undefined) {
        setText(value);
      }
    }, [value]);
    
  
   return (
    <>
      <label className={required ? "star" : ""} htmlFor={name}>{name}</label>
      <br />
      {multiline ?
        (
          <textarea 
            rows="10" 
            placeholder={placeholder} 
            id={name} 
            name={name} 
            maxLength={maxchars} 
            className="entryfield" 
            required={required} 
            value={controlledValue}
            onChange={handleChange}
          />
        ) : (
          <input 
            type="text" 
            placeholder={placeholder} 
            id={name} 
            name={name} 
            maxLength={maxchars} 
            className="entryfield" 
            required={required} 
            value={controlledValue}
            onChange={handleChange}
          />
        )}
        <br />
    </>
   );
}

export function DropDown( {placeholder = "", required = true, name, values, customInput=false, customAttributes, selected, onChange, customValue, onCustomChange, disabled = false} ) {
  const keys = Object.keys(values)
  const options = keys.map(key => (<option key={values[key]} value={values[key]}>{key}</option>));
  const [custom, setCustom] = useState(customInput);
  const handleChange = (e) => {
    const selectedOption = e.target.value;
    if (onChange) onChange(selectedOption);

    if ((selectedOption === "" || selectedOption === "none") && customInput) {
      setCustom(true);
    } else {
      setCustom(false);
    }
  };

  return(
    <>
      <label className={required ? "star" : ""} htmlFor={name}>{name}</label>
      <select 
      id={name} 
      name={name} 
      required={required}
      onChange={handleChange}
      value={selected}
      disabled={disabled}>
        <option className="default-drop-down" key={required ? "" : "none"} value={required ? "" : "none"}>{placeholder}</option>
        {options}
      </select>
      {customInput && custom ? (
        <>
          <br />
          <TextBox 
            placeholder={customAttributes?.placeholder || "Enter Text..."}
            multiline={customAttributes?.multiline || false}
            maxchars={customAttributes?.maxchars || null}
            required={customAttributes?.required ?? false} 
            name={customAttributes?.name}
            value={customValue}
            onChange={onCustomChange}
          />
        </>
      ) : null}
    </>
  );
}

export function validateLinks(str, justLink = false){
  let startIndex = 0;
  const hyperLinks = {
      success: true
  }
  let count = 0;
  while(true){
      //switched order
      let startBracket = str.indexOf("[", startIndex);
      if (startBracket < 0) break;
      let endBracket = str.indexOf("]", startBracket);
      if (endBracket < 0) break;
      if (str[endBracket + 1] !== "(") {
        startIndex = endBracket + 1;
        continue;
      }
      let endParanthesis = str.indexOf(")", endBracket + 1);
      if (endParanthesis < 0) break;

      const text = str.substring(startBracket + 1, endBracket);
      if (text === ''){
          hyperLinks.success = false;
          hyperLinks["error"] = "Hyperlink text reference cannot be empty.";
          break; 
      }
      const link = str.substring(endBracket + 2, endParanthesis);
      if (link === ''){
          hyperLinks.success = false;
          hyperLinks["error"] = "Reference link cannot be empty.";
          break;
      }
      if (link.indexOf("https://") < 0 && link.indexOf("http://") < 0){
          hyperLinks.success = false;
          hyperLinks["error"] = "Link must start with https:// or http://.";
          break;
      }
      const fullMatch = str.substring(startBracket, endParanthesis + 1);
      hyperLinks[fullMatch] = !justLink ? {
        link: (
          <a key={`${count++}`} href={link} target="_blank" rel="noopener noreferrer">
            {text}
          </a>
        ),
        startIndex: startBracket,
        endIndex: endParanthesis
      } : {
        link: text,
        startIndex: startBracket,
        endIndex: endParanthesis
      };

      startIndex = endParanthesis + 1;
  }
  return hyperLinks;
}
import { useTheme } from "@mui/material/styles";
import { useEffect, useState } from "react";

/** React Custom Hook to have updated screen dimensions as width and height _(in pixels)_ */
const useScreenSize = () => {
  const theme = useTheme();
  const [screenSize, setScreenSize] = useState({
    height: window.innerHeight,
    width: window.innerWidth,
  });

  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        height: window.innerHeight,
        width: window.innerWidth,
      });
    };

    window.addEventListener("resize", handleResize);

    // Clean up the event listener when the component unmounts
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return screenSize;
};

export default useScreenSize;

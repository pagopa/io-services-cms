import { useTheme } from "@mui/material";
import { useEffect, useState } from "react";

/** React Custom Hook to have updated screen dimensions as width and height _(in pixels)_ */
const useScreenSize = () => {
  const theme = useTheme();
  const [screenSize, setScreenSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight
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

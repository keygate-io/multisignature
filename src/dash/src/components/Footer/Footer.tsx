import React from "react";

const Footer: React.FC = () => {
  return (
    <div className="w-full bg-gray-300 h-[100px]">
      <p className="pt-4 p-12">
        &copy; {new Date().getFullYear()} Adipisicing occaecat minim enim quis
        ad esse reprehenderit laborum.
      </p>
    </div>
  );
};

export default Footer;

import { Button } from "antd";
import React from "react";
import { useInternetIdentity } from "../../hooks/use-internet-identity";

const Home: React.FC = () => {
  const { login, loginStatus } = useInternetIdentity();

  return (
    <div className="p-12">
      <h1 className="text-2xl font-bold m-0 bg-gray-700 text-white p-4">
        Ea minim duis laborum et eu eiusmod nostrud incididunt excepteur.
        <br />
        {loginStatus}
      </h1>
      <p>
        Cupidatat esse laborum enim ipsum Lorem voluptate enim magna aliqua amet
        velit aute eu. Nostrud irure excepteur et consequat labore elit et amet
        anim magna. Ex elit pariatur laborum minim elit Lorem irure. Sit elit
        aliqua consectetur Lorem ad cupidatat do officia eiusmod pariatur
        cupidatat. Laborum cupidatat fugiat nulla adipisicing occaecat do.
        Ullamco excepteur tempor minim Lorem.
      </p>
      <div className="grid grid-cols-2 grid-rows-2 gap-4 mt-8">
        <div className="bg-gray-700 text-white p-4">
          <h2 className="text-xl font-bold">Grid Item 1</h2>
          <p>
            Culpa pariatur ea sint cupidatat eu exercitation aute laboris id
            labore deserunt aute ad eu. Dolor in cillum velit velit occaecat
            proident in irure adipisicing sint proident laboris exercitation
            minim. Duis anim incididunt ipsum incididunt laboris ullamco do
            eiusmod ea nisi deserunt pariatur magna incididunt. Cupidatat
            excepteur aliqua ullamco ullamco tempor reprehenderit irure aliqua
            ut do qui.
          </p>
        </div>
        <div className="bg-gray-700 text-white p-4">
          <h2 className="text-xl font-bold">Grid Item 2</h2>
          <p>
            Proident et nulla officia dolore nulla do officia eiusmod magna.
            Excepteur sint duis qui qui do et amet anim et est cupidatat
            pariatur pariatur sunt. Pariatur tempor exercitation do sit magna
            commodo eiusmod sunt ex sit. Sunt laborum dolore esse commodo
            deserunt cupidatat id adipisicing laborum aute ex voluptate
            reprehenderit do. Laboris dolore officia reprehenderit esse laboris
            consectetur officia velit dolore dolore. Eiusmod minim quis anim
            pariatur eu in qui esse minim sunt incididunt aute minim eu.
          </p>
        </div>
        <div className="bg-gray-700 text-white p-4">
          <h2 className="text-xl font-bold">Grid Item 3</h2>
          <p>
            Ipsum adipisicing consectetur ut in nisi labore enim occaecat sunt
            cupidatat. Qui quis officia tempor do magna nisi quis quis minim.
            Ullamco elit culpa mollit Lorem. Reprehenderit non commodo eiusmod
            ex. Reprehenderit qui laborum consectetur ex id quis culpa magna.
            Proident veniam est esse excepteur ut commodo magna.
          </p>
        </div>
        <div className="bg-gray-700 text-white p-4">
          <h2 className="text-xl font-bold">Grid Item 4</h2>
          <p>
            Aute dolor nostrud ullamco occaecat eu et ullamco nostrud sint
            aliqua. Id est exercitation incididunt sunt officia consectetur
            commodo nisi deserunt. Laborum labore laboris excepteur aliqua et
            quis elit eu ad irure excepteur tempor. Fugiat anim consectetur esse
            proident magna dolor adipisicing mollit.
          </p>
        </div>
        <div className="col-span-2 bg-gray-700 text-white p-4">
          <Button type="primary" onClick={login}>
            Login
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Home;

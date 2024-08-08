export const idlFactory = ({ IDL }) => {
  return IDL.Service({
    'get_signees' : IDL.Func([], [IDL.Vec(IDL.Principal)], ['query']),
    'hello' : IDL.Func([], [IDL.Text], ['query']),
    'include_signee' : IDL.Func([IDL.Text], [], []),
  });
};
export const init = ({ IDL }) => { return []; };

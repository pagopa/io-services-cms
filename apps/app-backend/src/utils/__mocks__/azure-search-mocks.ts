import * as t from "io-ts";

export type ATestType = t.TypeOf<typeof ATestType>;
export const ATestType = t.type({
  a: t.string,
  b: t.number,
});

export const aValidMockedElement = {
  document: {
    a: "a",
    b: 1,
  },
};

export const anInvalidMockedElement = {
  document: {
    c: "a",
    d: 1,
  },
};

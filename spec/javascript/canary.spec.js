import td from "testdobule/dist/testdouble";

describe("Javascript testen", function() {
  it("Works as expected", function() {
    var mockFunction = td.function();
    td.when(mockFunction(42)).thenReturn("Function called!");

    expect(mockFunction(42)).toBe("Function Called!");
  });
});

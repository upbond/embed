import { TestBed } from "@angular/core/testing";

import { UpbondService } from "./upbond.service";

describe("UpbondService", () => {
  let service: UpbondService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UpbondService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});

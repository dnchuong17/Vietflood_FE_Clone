import {describe,it,expect} from "vitest";
import {calendarRange,reportPeriod,vietnamToday,validGps} from "./report-period";
describe("Vietnam report periods",()=>{
 it("uses Vietnam date across UTC midnight",()=>expect(vietnamToday(new Date("2026-11-01T18:00:00Z"))).toBe("2026-11-02"));
 it("daily range is inclusive in UTC+7",()=>expect(reportPeriod("day","2026-11-02")).toEqual({from:"2026-11-01T17:00:00.000Z",to:"2026-11-02T16:59:59.999Z"}));
 it("ISO week crosses the calendar year",()=>expect(reportPeriod("week","2020-W01")).toEqual({from:"2019-12-29T17:00:00.000Z",to:"2020-01-05T16:59:59.999Z"}));
 it("permits a genuine week 53",()=>expect(reportPeriod("week","2020-W53").to).toBe("2021-01-03T16:59:59.999Z"));
 it.each(["2021-W53","2026-W00","2026-W54","oops"])("rejects invalid ISO week %s",week=>expect(()=>reportPeriod("week",week)).toThrow());
 it.each([["2026-02-30","2026-03-01"],["2026-11-03","2026-11-02"],["2026-01-01","2026-02-01"],["x","x"]])("rejects invalid/reversed/oversize dates %s %s",(a,b)=>expect(()=>calendarRange(a,b)).toThrow());
 it("accepts 31 inclusive dates",()=>expect(calendarRange("2026-01-01","2026-01-31").from).toBeTruthy());
 it("preserves valid zero coordinates and excludes fabricated/missing GPS",()=>{expect(validGps(0,0)).toBe(true);for(const [lat,lng] of [[null,null],[NaN,12],[91,0],[0,181],["0",0],[Infinity,1]])expect(validGps(lat,lng)).toBe(false);});
});

declare const dateBrand: unique symbol;
export type JalaliDate = string & { readonly [dateBrand]: true };

export const markets = ["macro", "equities", "commodities", "energy", "gold_fx", "housing", "money_flow"] as const;
export type Market = (typeof markets)[number];
export const frequencies = ["daily", "weekly", "monthly", "quarterly", "annual"] as const;
export type Frequency = (typeof frequencies)[number];
export const statuses = ["قطعی", "تخمینی", "تأییدنشده"] as const;
export type ObservationStatus = (typeof statuses)[number];

export interface SeriesKey {
  readonly market: Market;
  readonly indicator: string;
  readonly entity: string;
}

export interface Observation extends SeriesKey {
  readonly observation_id: string;
  readonly value: number;
  readonly unit: string;
  readonly date: JalaliDate;
  readonly frequency: Frequency;
  readonly source_name: string;
  readonly source_url: string;
  readonly publish_date: JalaliDate;
  readonly status: ObservationStatus;
  readonly notes: string;
}

export interface OfficialObservation extends Observation {
  readonly status: "قطعی";
}

export interface ObservationQuery extends SeriesKey {
  readonly from?: JalaliDate;
  readonly to?: JalaliDate;
}

export interface ObservationRepository {
  list(query: ObservationQuery): Promise<readonly Observation[]>;
}

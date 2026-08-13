/**
 * Thin wrapper around the auto-generated MicrosoftDataverseService.
 *
 * The Dataverse *connector* (shared_commondataserviceforapps) differs from native
 * Dataverse: it generates a single untyped service whose operations require an
 * `organization` (the Dataverse org URL) plus explicit prefer/accept headers.
 *
 * This module centralizes that boilerplate so feature modules under `src/data/`
 * can call simple list/get/create/update/delete/associate methods and work with
 * plain row objects, instead of hand-rolling fetch/axios calls against Dataverse.
 *
 * Pattern follows microsoft/PowerAppsCodeApps `samples/DataverseConnector`.
 */
import { getContext } from '@microsoft/power-apps/app';
import { MicrosoftDataverseService } from '../generated';

const PREFER = 'return=representation';
// Reads ask Dataverse to include annotations so lookup display names come back as
// `_<field>_value@OData.Community.Display.V1.FormattedValue`.
const READ_PREFER = 'odata.include-annotations="*"';
const ACCEPT = 'application/json';

/** A Dataverse row is a flat object of column name -> value (plus @odata.* annotations). */
export type DataverseRow = Record<string, unknown>;

export interface ListOptions {
  select?: string[];
  filter?: string;
  orderBy?: string[];
  top?: number;
  expand?: string;
}

let cachedOrgUrl: string | undefined;

/** Resolves and caches the Dataverse org URL from the Power SDK context. */
export async function getOrgUrl(): Promise<string> {
  if (cachedOrgUrl) return cachedOrgUrl;
  const ctx = await getContext();
  const orgUrl = ctx.app.dataverseOrgUrl;
  if (!orgUrl) {
    throw new Error(
      'Dataverse org URL is not available from the Power Platform context (context.app.dataverseOrgUrl is undefined).',
    );
  }
  cachedOrgUrl = orgUrl;
  return orgUrl;
}

/** Unwraps the connector result envelope, throwing a readable error on failure. */
function unwrap<T>(result: { success?: boolean; data?: T; error?: { message?: string } }): T {
  if (result.success === false) {
    let message = result.error?.message ?? 'Unknown Dataverse connector error';
    // The connector often returns a JSON string in error.message; surface the inner message.
    try {
      const parsed = JSON.parse(message) as { Message?: string };
      if (parsed.Message) message = parsed.Message;
    } catch {
      // not JSON — use as-is
    }
    throw new Error(message);
  }
  return result.data as T;
}

/** List rows from a Dataverse table via the connector. entityName is the plural entity set name. */
export async function listRows(entityName: string, options: ListOptions = {}): Promise<DataverseRow[]> {
  const org = await getOrgUrl();
  const result = await MicrosoftDataverseService.ListRecordsWithOrganization(
    org,
    entityName,
    READ_PREFER,
    ACCEPT,
    undefined, // x-ms-odata-metadata-full
    undefined, // MSCRM.IncludeMipSensitivityLabel
    options.select?.join(','),
    options.filter,
    options.orderBy?.join(','),
    options.expand,
    undefined, // fetchXml
    options.top,
  );
  const data = unwrap<{ value?: DataverseRow[] }>(result);
  return data.value ?? [];
}

/** Get a single row by its primary-key GUID. */
export async function getRow(entityName: string, recordId: string, select?: string[]): Promise<DataverseRow> {
  const org = await getOrgUrl();
  const result = await MicrosoftDataverseService.GetItemWithOrganization(
    READ_PREFER,
    ACCEPT,
    org,
    entityName,
    recordId,
    undefined,
    undefined,
    select?.join(','),
  );
  return unwrap<DataverseRow>(result);
}

/** Create a new row. Returns the created row (including its primary-key GUID). */
export async function createRow(entityName: string, item: DataverseRow): Promise<DataverseRow> {
  const org = await getOrgUrl();
  const result = await MicrosoftDataverseService.CreateRecordWithOrganization(PREFER, ACCEPT, org, entityName, item);
  // The connector's generated typing declares CreateRecord's response as `void`, but Dataverse
  // honors the `return=representation` Prefer header and returns the full created row — cast
  // through unknown to recover it (verified against the connector's OpenAPI schema).
  return unwrap<unknown>(result as unknown as { success?: boolean; data?: unknown }) as DataverseRow;
}

/** Update an existing row (upsert semantics). */
export async function updateRow(entityName: string, recordId: string, item: DataverseRow): Promise<DataverseRow> {
  const org = await getOrgUrl();
  const result = await MicrosoftDataverseService.UpdateRecordWithOrganization(
    PREFER,
    ACCEPT,
    org,
    entityName,
    recordId,
    item,
  );
  return unwrap<DataverseRow>(result);
}

/** Delete a row by its primary-key GUID. */
export async function deleteRow(entityName: string, recordId: string): Promise<void> {
  const org = await getOrgUrl();
  const result = await MicrosoftDataverseService.DeleteRecordWithOrganization(org, entityName, recordId);
  unwrap<void>(result);
}

/**
 * Associate a row with another row via a named N:N (or 1:N) relationship.
 * @param entityName plural entity set name of the row that owns the relationship
 * @param recordId GUID of that row
 * @param relationshipName schema name of the relationship (e.g. "rpo_PoutineSubmission_Tag")
 * @param targetEntityName plural entity set name of the row being linked
 * @param targetRecordId GUID of the row being linked
 */
export async function associateRows(
  entityName: string,
  recordId: string,
  relationshipName: string,
  targetEntityName: string,
  targetRecordId: string,
): Promise<void> {
  const org = await getOrgUrl();
  const result = await MicrosoftDataverseService.AssociateEntitiesWithOrganization(org, entityName, recordId, relationshipName, {
    '@odata.id': `${org.replace(/\/$/, '')}/api/data/v9.2/${targetEntityName}(${targetRecordId})`,
  });
  unwrap<void>(result);
}

/** Removes an association created by {@link associateRows}. */
export async function disassociateRows(
  entityName: string,
  recordId: string,
  relationshipName: string,
  targetEntityName: string,
  targetRecordId: string,
): Promise<void> {
  const org = await getOrgUrl();
  const result = await MicrosoftDataverseService.DisassociateEntitiesWithOrganization(
    org,
    entityName,
    recordId,
    relationshipName,
    `${org.replace(/\/$/, '')}/api/data/v9.2/${targetEntityName}(${targetRecordId})`,
  );
  unwrap<void>(result);
}

/** Strips the "data:<mime>;base64," prefix from a data URL, returning raw base64. */
function stripDataUrlPrefix(dataUrl: string): string {
  const comma = dataUrl.indexOf(',');
  return comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
}

/** Reads a File/Blob as a base64 string (no data-URL prefix). */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(stripDataUrlPrefix(String(reader.result)));
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/** Upload a file or image to a Dataverse file/image column (e.g. "rpo_photo"). */
export async function uploadFileImage(
  entityName: string,
  recordId: string,
  columnName: string,
  file: File,
): Promise<void> {
  const org = await getOrgUrl();
  const base64 = await fileToBase64(file);
  // Per the connector's OpenAPI schema, the body is binary (base64-encoded here) and
  // content-type defaults to "application/octet-stream" — the connector accepts that for
  // both File and Image column types.
  const result = await MicrosoftDataverseService.UpdateEntityFileImageFieldContentWithOrganization(
    'application/octet-stream',
    org,
    entityName,
    recordId,
    columnName,
    base64,
    file.name,
  );
  unwrap<void>(result);
}

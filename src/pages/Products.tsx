import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { asList, cls, fd, pick } from "../lib/format";

import {
  Button,
  Confirm,
  EmptyState,
  ErrorState,
  Field,
  Icon,
  IconBtn,
  Input,
  LoadMore,
  Modal,
  Money,
  PageHead,
  Select,
  Textarea,
  Thumb,
  toast,
} from "../components/ui";

const PAGE = 24;
const MAX_IMAGES = 10;
const MAX_VARIANTS = 50;
const MAX_IMPORT_ROWS = 500;

const MAX_PRODUCT_NAME = 120;
const MAX_PRODUCT_SKU = 64;
const MAX_VARIANT_NAME = 80;
const MAX_DESCRIPTION = 2000;
const MAX_MONEY = 99999999.99;
const MAX_IMAGE_SIZE = 10_485_760;

interface VariantRow {
  key: number;
  name: string;
  sellingPrice: string;
  sku: string;
  initialStock: string;
}

interface FormState {
  name: string;
  sku: string;
  price: string;
  costPrice: string;
  discountPrice: string;
  description: string;
  categoryId: string;
  unitId: string;
  lowStockThreshold: string;
  expiryDate: string;
  initialStock: string;
  images: string[];
  variantRows: VariantRow[];
}

interface ImportProduct {
  name: string;
  price: string;
  costPrice: string | null;
  description: string | null;
  images: string[];
  coverImageUrl: string | null;
  categoryId: string | null;
  unitId: string | null;
  initialStock: number | null;
}

interface ImportRow {
  rowNumber: number;
  status: "new" | "duplicate" | "error";
  errors: string[];
  existingProductId: string | null;
  existingName: string | null;
  product: ImportProduct | null;
}

interface ImportResponse {
  importId: string;
  rows: ImportRow[];
  summary: {
    new: number;
    duplicates: number;
    errors: number;
  };
  expiresAt: string;
}

const BLANK: FormState = {
  name: "",
  sku: "",
  price: "",
  costPrice: "",
  discountPrice: "",
  description: "",
  categoryId: "",
  unitId: "",
  lowStockThreshold: "",
  expiryDate: "",
  initialStock: "",
  images: [],
  variantRows: [],
};

export default function Products() {
  const { me } = useAuth();

  const store = me.store || {};
  const currency: string = store.currency || "NGN";

  const [params, setParams] = useSearchParams();

  const [items, setItems] = useState<any[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [cats, setCats] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<FormState>(BLANK);
  const [formBusy, setFormBusy] = useState(false);
  const [formErr, setFormErr] = useState("");

  const [newCat, setNewCat] = useState("");
  const [newUnit, setNewUnit] = useState("");

  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [delFor, setDelFor] = useState<any | null>(null);
  const [delBusy, setDelBusy] = useState(false);

  const [importOpen, setImportOpen] = useState(false);
  const [importBusy, setImportBusy] = useState(false);
  const [importConfirmBusy, setImportConfirmBusy] =
    useState(false);
  const [importErr, setImportErr] = useState("");
  const [importData, setImportData] =
    useState<ImportResponse | null>(null);

  const [duplicateResolution, setDuplicateResolution] =
    useState<Record<number, "skip" | "overwrite">>({});

  const importFileRef =
    useRef<HTMLInputElement>(null);

  /*
   * ---------------------------------------------------------------------------
   * CATALOG
   * ---------------------------------------------------------------------------
   */

  const loadCatalog = useCallback(async () => {
    try {
      const res = await api.get(
        "/api/dashboard/categories"
      );

      setCats(
        asList(
          res,
          "categories",
          "items",
          "data"
        )
      );
    } catch {
      // Category loading is optional for rendering.
    }

    try {
      const res = await api.get(
        "/api/dashboard/units"
      );

      setUnits(
        asList(
          res,
          "units",
          "items",
          "data"
        )
      );
    } catch {
      // Unit loading is optional for rendering.
    }
  }, []);

  /*
   * ---------------------------------------------------------------------------
   * PRODUCTS
   * ---------------------------------------------------------------------------
   */

  const load = useCallback(
    async (cursor?: string | null) => {
      if (!cursor) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      setError(null);

      try {
        const qs = new URLSearchParams();

        /*
         * Product contract allows ONLY:
         * - limit
         * - cursor
         */

        qs.set("limit", String(PAGE));

        if (cursor) {
          qs.set("cursor", cursor);
        }

        const res = await api.get(
          `/api/dashboard/products?${qs.toString()}`
        );

        const list = asList(
          res,
          "items",
          "products",
          "data"
        );

        setItems((prev) =>
          cursor
            ? [...prev, ...list]
            : list
        );

        setNextCursor(
          pick(res, ["nextCursor"]) ?? null
        );

        setTotal(
          typeof res?.total === "number"
            ? res.total
            : list.length
        );
      } catch (e: any) {
        setError(
          e?.message ||
            "Couldn't load products."
        );
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  /*
   * ---------------------------------------------------------------------------
   * CREATE / EDIT
   * ---------------------------------------------------------------------------
   */

  const openCreate = useCallback(() => {
    setEditing(null);
    setForm(BLANK);
    setFormErr("");
    setNewCat("");
    setNewUnit("");
    setImageUrl("");
    setFormOpen(true);
  }, []);

  const openEdit = useCallback((x: any) => {
    setEditing(x);

    setForm({
      name: x.name || "",
      sku: x.sku || "",

      price:
        x.price != null
          ? String(x.price)
          : "",

      costPrice:
        x.costPrice != null
          ? String(x.costPrice)
          : "",

      discountPrice:
        x.discountPrice != null
          ? String(x.discountPrice)
          : "",

      description:
        x.description || "",

      categoryId:
        x.categoryId ||
        x.category?.id ||
        "",

      unitId:
        x.unitId ||
        x.unit?.id ||
        "",

      lowStockThreshold:
        x.lowStockThreshold != null
          ? String(x.lowStockThreshold)
          : "",

      expiryDate: x.expiryDate
        ? String(x.expiryDate).slice(0, 10)
        : "",

      initialStock: "",

      images:
        Array.isArray(x.images)
          ? [...x.images]
          : x.coverImageUrl
            ? [x.coverImageUrl]
            : [],

      variantRows:
        Array.isArray(x.variants)
          ? x.variants.map(
              (v: any, i: number) => ({
                key: i,
                name: v.name || "",
                sellingPrice:
                  v.sellingPrice != null
                    ? String(
                        v.sellingPrice
                      )
                    : "",
                sku: v.sku || "",
                initialStock: "",
              })
            )
          : [],
    });

    setFormErr("");
    setNewCat("");
    setNewUnit("");
    setImageUrl("");
    setFormOpen(true);
  }, []);

  useEffect(() => {
    if (params.get("new") === "1") {
      openCreate();

      const next = new URLSearchParams(
        params
      );

      next.delete("new");

      setParams(next, {
        replace: true,
      });
    }
  }, [
    params,
    setParams,
    openCreate,
  ]);

  const submitForm = async () => {
    setFormErr("");

    const name = form.name.trim();

    /*
     * -------------------------------------------------------------------------
     * BASIC VALIDATION
     * -------------------------------------------------------------------------
     */

    if (!name) {
      setFormErr(
        "Give the product a name."
      );
      return;
    }

    if (name.length > MAX_PRODUCT_NAME) {
      setFormErr(
        `Product name must be ${MAX_PRODUCT_NAME} characters or fewer.`
      );
      return;
    }

    const sku = form.sku.trim();

    if (sku.length > MAX_PRODUCT_SKU) {
      setFormErr(
        `SKU must be ${MAX_PRODUCT_SKU} characters or fewer.`
      );
      return;
    }

    const price = Number(form.price);

    if (
      !Number.isFinite(price) ||
      price <= 0 ||
      Math.round(price * 100) !==
        price * 100 ||
      price > MAX_MONEY
    ) {
      setFormErr(
        "Enter a valid price greater than zero with at most 2 decimal places."
      );
      return;
    }

    const costPrice =
      form.costPrice.trim()
        ? Number(form.costPrice)
        : null;

    if (
      costPrice != null &&
      (
        !Number.isFinite(costPrice) ||
        costPrice < 0 ||
        costPrice > MAX_MONEY ||
        Math.round(costPrice * 100) !==
          costPrice * 100
      )
    ) {
      setFormErr(
        "Enter a valid cost price."
      );
      return;
    }

    const discountPrice =
      form.discountPrice.trim()
        ? Number(form.discountPrice)
        : null;

    if (
      discountPrice != null &&
      (
        !Number.isFinite(
          discountPrice
        ) ||
        discountPrice < 0 ||
        discountPrice >= price ||
        discountPrice > MAX_MONEY ||
        Math.round(
          discountPrice * 100
        ) !==
          discountPrice * 100
      )
    ) {
      setFormErr(
        "Discount price must be lower than the price and have at most 2 decimal places."
      );
      return;
    }

    const description =
      form.description.trim();

    if (
      description.length >
      MAX_DESCRIPTION
    ) {
      setFormErr(
        `Description must be ${MAX_DESCRIPTION} characters or fewer.`
      );
      return;
    }

    /*
     * -------------------------------------------------------------------------
     * STOCK / VARIANT VALIDATION
     * -------------------------------------------------------------------------
     */

    const variants =
      form.variantRows.filter(
        (v) => v.name.trim()
      );

    if (
      variants.length >
      MAX_VARIANTS
    ) {
      setFormErr(
        `Maximum ${MAX_VARIANTS} variants allowed.`
      );
      return;
    }

    const opening =
      form.initialStock.trim()
        ? Number(form.initialStock)
        : null;

    if (
      opening != null &&
      (
        !Number.isInteger(opening) ||
        opening < 1 ||
        opening > 1000000
      )
    ) {
      setFormErr(
        "Opening stock must be an integer between 1 and 1,000,000."
      );
      return;
    }

    if (
      !editing &&
      variants.length > 0 &&
      opening != null
    ) {
      setFormErr(
        "Initial stock and variants cannot be used together."
      );
      return;
    }

    for (const variant of variants) {
      const variantName =
        variant.name.trim();

      if (
        variantName.length >
        MAX_VARIANT_NAME
      ) {
        setFormErr(
          `Variant names must be ${MAX_VARIANT_NAME} characters or fewer.`
        );
        return;
      }

      if (
        variant.sku.trim().length >
        MAX_PRODUCT_SKU
      ) {
        setFormErr(
          `SKU for variant "${variantName}" is too long.`
        );
        return;
      }

      if (
        variant.sellingPrice.trim()
      ) {
        const value =
          Number(
            variant.sellingPrice
          );

        if (
          !Number.isFinite(value) ||
          value < 0 ||
          value > MAX_MONEY ||
          Math.round(value * 100) !==
            value * 100
        ) {
          setFormErr(
            `Invalid selling price for variant "${variantName}".`
          );
          return;
        }
      }

      if (
        variant.initialStock.trim()
      ) {
        const stock =
          Number(
            variant.initialStock
          );

        if (
          !Number.isInteger(stock) ||
          stock < 1 ||
          stock > 1000000
        ) {
          setFormErr(
            `Invalid initial stock for variant "${variantName}".`
          );
          return;
        }
      }
    }

    /*
     * -------------------------------------------------------------------------
     * LOW-STOCK VALIDATION
     *
     * Do this BEFORE creating a category or unit so invalid product data
     * cannot leave behind a newly-created category/unit.
     * -------------------------------------------------------------------------
     */

    let lowStockThreshold:
      number | null = null;

    if (
      form.lowStockThreshold.trim()
    ) {
      const threshold =
        Number(
          form.lowStockThreshold
        );

      if (
        !Number.isInteger(
          threshold
        ) ||
        threshold < 0
      ) {
        setFormErr(
          "Low-stock threshold must be a non-negative integer."
        );
        return;
      }

      lowStockThreshold =
        threshold;
    }

    /*
     * -------------------------------------------------------------------------
     * DATE VALIDATION
     * -------------------------------------------------------------------------
     */

    let expiryDate:
      string | null = null;

    if (form.expiryDate) {
      const parsed =
        new Date(
          `${form.expiryDate}T00:00:00Z`
        );

      if (
        Number.isNaN(
          parsed.getTime()
        )
      ) {
        setFormErr(
          "Enter a valid expiry date."
        );
        return;
      }

      expiryDate =
        parsed.toISOString();
    }

    /*
     * -------------------------------------------------------------------------
     * IMAGE VALIDATION
     * -------------------------------------------------------------------------
     */

    if (
      form.images.length >
      MAX_IMAGES
    ) {
      setFormErr(
        `Maximum ${MAX_IMAGES} images allowed.`
      );
      return;
    }

    for (const image of form.images) {
      if (image.length > 2048) {
        setFormErr(
          "Image URL must be 2048 characters or fewer."
        );
        return;
      }
    }

    /*
     * -------------------------------------------------------------------------
     * CATEGORY / UNIT
     * -------------------------------------------------------------------------
     */

    let categoryId =
      form.categoryId;

    let unitId =
      form.unitId;

    setFormBusy(true);

    try {
      /*
       * Create category only after all product validation above has passed.
       */

      if (
        categoryId === "__new"
      ) {
        const categoryName =
          newCat.trim();

        if (!categoryName) {
          setFormErr(
            "Enter a category name."
          );
          return;
        }

        const res =
          await api.post(
            "/api/dashboard/categories",
            {
              name: categoryName,
            }
          );

        categoryId =
          pick(res, ["id"]) ||
          res?.category?.id ||
          res?.data?.id ||
          "";

        if (!categoryId) {
          throw new Error(
            "Couldn't create the category."
          );
        }

        await loadCatalog();
      }

      /*
       * Create unit only after all product validation above has passed.
       */

      if (
        unitId === "__new"
      ) {
        const unitName =
          newUnit.trim();

        if (!unitName) {
          setFormErr(
            "Enter a unit name."
          );
          return;
        }

        const res =
          await api.post(
            "/api/dashboard/units",
            {
              name: unitName,
            }
          );

        unitId =
          pick(res, ["id"]) ||
          res?.unit?.id ||
          res?.data?.id ||
          "";

        if (!unitId) {
          throw new Error(
            "Couldn't create the unit."
          );
        }

        await loadCatalog();
      }

      /*
       * -----------------------------------------------------------------------
       * PRODUCT PAYLOAD
       * -----------------------------------------------------------------------
       */

      const payload:
        Record<string, unknown> =
        {
          name,
          price,
        };

      if (sku) {
        payload.sku = sku;
      } else if (editing) {
        payload.sku = null;
      }

      if (costPrice != null) {
        payload.costPrice =
          costPrice;
      } else if (editing) {
        payload.costPrice = null;
      }

      if (description) {
        payload.description =
          description;
      } else if (editing) {
        payload.description = null;
      }

      if (
        discountPrice != null
      ) {
        payload.discountPrice =
          discountPrice;
      } else if (editing) {
        payload.discountPrice = null;
      }

      if (categoryId) {
        payload.categoryId =
          categoryId;
      } else if (editing) {
        payload.categoryId = null;
      }

      if (unitId) {
        payload.unitId =
          unitId;
      } else if (editing) {
        payload.unitId = null;
      }

      if (
        lowStockThreshold != null
      ) {
        payload.lowStockThreshold =
          lowStockThreshold;
      } else if (editing) {
        payload.lowStockThreshold =
          null;
      }

      if (expiryDate) {
        payload.expiryDate =
          expiryDate;
      } else if (editing) {
        payload.expiryDate = null;
      }

      if (
        form.images.length > 0
      ) {
        payload.images =
          form.images.slice(
            0,
            MAX_IMAGES
          );

        payload.coverImageUrl =
          form.images[0];
      } else if (editing) {
        payload.images = [];
        payload.coverImageUrl =
          null;
      }

      /*
       * -----------------------------------------------------------------------
       * CREATE-ONLY STOCK / VARIANTS
       *
       * IMPORTANT:
       * We intentionally do NOT send:
       *
       * - status
       * - quantity
       * - variants on PATCH
       * - initialStock on PATCH
       * -----------------------------------------------------------------------
       */

      if (!editing) {
        if (variants.length > 0) {
          payload.variants =
            variants.map(
              (v) => {
                const row:
                  Record<
                    string,
                    unknown
                  > = {
                    name:
                      v.name.trim(),
                  };

                if (
                  v.sellingPrice.trim()
                ) {
                  row.sellingPrice =
                    Number(
                      v.sellingPrice
                    );
                }

                if (v.sku.trim()) {
                  row.sku =
                    v.sku.trim();
                }

                if (
                  v.initialStock.trim()
                ) {
                  row.initialStock =
                    Number(
                      v.initialStock
                    );
                }

                return row;
              }
            );
        } else if (
          opening != null
        ) {
          payload.initialStock =
            opening;
        }
      }

      /*
       * -----------------------------------------------------------------------
       * SAVE
       * -----------------------------------------------------------------------
       */

      if (editing) {
        await api.patch(
          `/api/dashboard/products/${editing.id}`,
          payload
        );

        toast.success(
          "Product updated."
        );
      } else {
        await api.post(
          "/api/dashboard/products",
          payload
        );

        toast.success(
          "Product created."
        );
      }

      setFormOpen(false);

      await load();
    } catch (e: any) {
      setFormErr(
        e?.message ||
          "Couldn't save the product."
      );
    } finally {
      setFormBusy(false);
    }
  };

  /*
   * ---------------------------------------------------------------------------
   * STATUS
   * ---------------------------------------------------------------------------
   */

  const toggleStatus = async (
    product: any
  ) => {
    try {
      if (
        product.status ===
        "PUBLISHED"
      ) {
        await api.post(
          `/api/dashboard/products/${product.id}/unpublish`
        );

        toast.success(
          "Product moved to draft."
        );
      } else {
        await api.post(
          `/api/dashboard/products/${product.id}/publish`
        );

        toast.success(
          "Product published — it's now buyable."
        );
      }

      await load();
    } catch (e: any) {
      toast.error(
        e?.message ||
          "Couldn't change product status."
      );
    }
  };

  /*
   * ---------------------------------------------------------------------------
   * DELETE
   * ---------------------------------------------------------------------------
   */

  const confirmDelete =
    async () => {
      if (!delFor) return;

      setDelBusy(true);

      try {
        await api.del(
          `/api/dashboard/products/${delFor.id}`
        );

        toast.success(
          "Product deleted."
        );

        setDelFor(null);

        await load();
      } catch (e: any) {
        toast.error(
          e?.message ||
            "Couldn't delete the product."
        );
      } finally {
        setDelBusy(false);
      }
    };

  /*
   * ---------------------------------------------------------------------------
   * IMAGE URL
   * ---------------------------------------------------------------------------
   */

  const addImageUrl = () => {
    const url =
      imageUrl.trim();

    if (!url) return;

    try {
      new URL(url);
    } catch {
      toast.error(
        "Enter a valid image URL."
      );
      return;
    }

    if (url.length > 2048) {
      toast.error(
        "Image URL must be 2048 characters or fewer."
      );
      return;
    }

    if (
      form.images.length >=
      MAX_IMAGES
    ) {
      toast.error(
        `Maximum ${MAX_IMAGES} images allowed.`
      );
      return;
    }

    if (
      form.images.includes(url)
    ) {
      toast.error(
        "This image has already been added."
      );
      return;
    }

    setForm(
      (current) => ({
        ...current,
        images: [
          ...current.images,
          url,
        ].slice(
          0,
          MAX_IMAGES
        ),
      })
    );

    setImageUrl("");
  };

  /*
   * ---------------------------------------------------------------------------
   * IMAGE UPLOAD
   * ---------------------------------------------------------------------------
   */

  const handleFiles =
    async (
      files: FileList | null
    ) => {
      if (!files?.length) return;

      const availableSlots =
        MAX_IMAGES -
        form.images.length;

      if (availableSlots <= 0) {
        toast.error(
          `Maximum ${MAX_IMAGES} images allowed.`
        );
        return;
      }

      setUploading(true);

      try {
        const allowedTypes = [
          "image/jpeg",
          "image/png",
          "image/webp",
        ];

        const selectedFiles =
          Array.from(files).slice(
            0,
            availableSlots
          );

        for (const file of selectedFiles) {
          try {
            if (
              !allowedTypes.includes(
                file.type
              )
            ) {
              throw new Error(
                "Only JPEG, PNG, and WebP images are supported."
              );
            }

            if (
              file.size < 1 ||
              file.size >
                MAX_IMAGE_SIZE
            ) {
              throw new Error(
                "Each image must be between 1 byte and 10 MB."
              );
            }

            /*
             * IMPORTANT:
             *
             * declaredSizeBytes MUST remain a number.
             */

            const preset: any =
              await api.post(
                "/api/dashboard/uploads/presign-product-image",
                {
                  fileName:
                    file.name,
                  contentType:
                    file.type,
                  declaredSizeBytes:
                    file.size,
                }
              );

            if (
              !preset?.uploadUrl ||
              !preset?.publicUrl
            ) {
              throw new Error(
                "The upload service did not return the required URLs."
              );
            }

            const response =
              await fetch(
                preset.uploadUrl,
                {
                  method: "PUT",
                  headers: {
                    "Content-Type":
                      file.type,
                  },
                  body: file,
                }
              );

            if (!response.ok) {
              throw new Error(
                `Image upload failed (${response.status}).`
              );
            }

            if (
              preset.publicUrl
                .length > 2048
            ) {
              throw new Error(
                "The returned image URL is too long."
              );
            }

            setForm(
              (current) => {
                if (
                  current.images.includes(
                    preset.publicUrl
                  )
                ) {
                  return current;
                }

                return {
                  ...current,
                  images: [
                    ...current.images,
                    preset.publicUrl,
                  ].slice(
                    0,
                    MAX_IMAGES
                  ),
                };
              }
            );
          } catch (e: any) {
            toast.error(
              e?.message ||
                "Image upload failed."
            );
          }
        }
      } finally {
        setUploading(false);

        if (fileRef.current) {
          fileRef.current.value =
            "";
        }
      }
    };

  /*
   * ---------------------------------------------------------------------------
   * BULK IMPORT
   * ---------------------------------------------------------------------------
   */

  const openImport = () => {
    setImportOpen(true);
    setImportErr("");
    setImportData(null);
    setDuplicateResolution({});

    if (importFileRef.current) {
      importFileRef.current.value =
        "";
    }
  };

  const closeImport = () => {
    if (
      importBusy ||
      importConfirmBusy
    ) {
      return;
    }

    setImportOpen(false);
    setImportErr("");
    setImportData(null);
    setDuplicateResolution({});
  };

  /*
   * ---------------------------------------------------------------------------
   * CSV PARSER
   * ---------------------------------------------------------------------------
   */

  const parseCsv = (
    text: string
  ): string[][] => {
    const rows: string[][] = [];

    let row: string[] = [];
    let cell = "";
    let quoted = false;

    for (
      let i = 0;
      i < text.length;
      i++
    ) {
      const char = text[i];
      const next =
        text[i + 1];

      /*
       * Escaped quote:
       * ""
       */
      if (
        char === '"' &&
        quoted &&
        next === '"'
      ) {
        cell += '"';
        i++;
        continue;
      }

      /*
       * Opening / closing quote.
       */
      if (char === '"') {
        quoted = !quoted;
        continue;
      }

      /*
       * Comma outside quotes.
       */
      if (
        char === "," &&
        !quoted
      ) {
        row.push(cell);
        cell = "";
        continue;
      }

      /*
       * Newline outside quotes.
       */
      if (
        (
          char === "\n" ||
          char === "\r"
        ) &&
        !quoted
      ) {
        if (
          char === "\r" &&
          next === "\n"
        ) {
          i++;
        }

        row.push(cell);
        cell = "";

        if (
          row.some(
            (value) =>
              value.trim() !== ""
          )
        ) {
          rows.push(row);
        }

        row = [];

        continue;
      }

      cell += char;
    }

    /*
     * Reject malformed CSV with an unclosed quote.
     */
    if (quoted) {
      throw new Error(
        "Invalid CSV: an opening quote was not closed."
      );
    }

    row.push(cell);

    if (
      row.some(
        (value) =>
          value.trim() !== ""
      )
    ) {
      rows.push(row);
    }

    return rows;
  };

  const normalizeCsvHeader = (
    value: string
  ) =>
    value
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "");

  /*
   * ---------------------------------------------------------------------------
   * CSV IMPORT PREVIEW
   * ---------------------------------------------------------------------------
   */

  const importCsv = async (
    file: File
  ) => {
    setImportBusy(true);
    setImportErr("");

    try {
      const text =
        await file.text();

      const csvRows =
        parseCsv(text);

      if (
        csvRows.length < 2
      ) {
        throw new Error(
          "The CSV must contain a header row and at least one product row."
        );
      }

      const headers =
        csvRows[0].map(
          normalizeCsvHeader
        );

      const nameIndex =
        headers.indexOf(
          "name"
        );

      const priceIndex =
        headers.indexOf(
          "price"
        );

      if (
        nameIndex === -1 ||
        priceIndex === -1
      ) {
        throw new Error(
          'CSV must contain "name" and "price" columns.'
        );
      }

      const indexOf = (
        ...names: string[]
      ) => {
        for (const name of names) {
          const index =
            headers.indexOf(
              normalizeCsvHeader(
                name
              )
            );

          if (index !== -1) {
            return index;
          }
        }

        return -1;
      };

      /*
       * SKU is deliberately NOT included in the bulk import payload because
       * the documented bulk-import row contract does not include it.
       */

      const costPriceIndex =
        indexOf(
          "costPrice",
          "cost price"
        );

      const descriptionIndex =
        indexOf(
          "description"
        );

      const imagesIndex =
        indexOf("images");

      const coverImageIndex =
        indexOf(
          "coverImageUrl",
          "cover image url"
        );

      const categoryIndex =
        indexOf(
          "categoryId",
          "category id"
        );

      const unitIndex =
        indexOf(
          "unitId",
          "unit id"
        );

      const initialStockIndex =
        indexOf(
          "initialStock",
          "initial stock"
        );

      if (
        csvRows.length - 1 >
        MAX_IMPORT_ROWS
      ) {
        throw new Error(
          `A bulk import can contain at most ${MAX_IMPORT_ROWS} rows.`
        );
      }

      const rows =
        csvRows
          .slice(1)
          .map(
            (
              values,
              index
            ) => {
              const value = (
                columnIndex: number
              ) =>
                columnIndex === -1
                  ? ""
                  : (
                      values[
                        columnIndex
                      ] || ""
                    ).trim();

              const imageValue =
                value(
                  imagesIndex
                );

              const initialStockValue =
                value(
                  initialStockIndex
                );

              return {
                name:
                  value(
                    nameIndex
                  ),

                price:
                  value(
                    priceIndex
                  ),

                costPrice:
                  value(
                    costPriceIndex
                  ) || null,

                description:
                  value(
                    descriptionIndex
                  ) || null,

                images:
                  imageValue
                    ? imageValue
                        .split("|")
                        .map(
                          (v) =>
                            v.trim()
                        )
                        .filter(
                          Boolean
                        )
                    : [],

                coverImageUrl:
                  value(
                    coverImageIndex
                  ) || null,

                categoryId:
                  value(
                    categoryIndex
                  ) || null,

                unitId:
                  value(
                    unitIndex
                  ) || null,

                initialStock:
                  initialStockValue
                    ? Number(
                        initialStockValue
                      )
                    : undefined,
              };
            }
          );

      /*
       * IMPORTANT:
       *
       * The API contract says the bulk import endpoint accepts exactly the
       * documented row fields.
       */

      const payload = {
        rows,
      };

      const result =
        await api.post(
          "/api/dashboard/products/bulk/import",
          payload
        );

      setImportData(result);

      const resolution: Record<
        number,
        "skip" | "overwrite"
      > = {};

      for (
        const row of
        result.rows || []
      ) {
        if (
          row.status ===
          "duplicate"
        ) {
          resolution[
            row.rowNumber
          ] = "skip";
        }
      }

      setDuplicateResolution(
        resolution
      );
    } catch (e: any) {
      setImportErr(
        e?.message ||
          "Couldn't preview the CSV import."
      );
    } finally {
      setImportBusy(false);

      if (importFileRef.current) {
        importFileRef.current.value =
          "";
      }
    }
  };

  /*
   * ---------------------------------------------------------------------------
   * BULK IMPORT CONFIRM
   * ---------------------------------------------------------------------------
   */

  const confirmImport =
    async () => {
      if (!importData) {
        return;
      }

      if (
        importData.summary.errors >
        0
      ) {
        toast.error(
          "Rows with errors cannot be imported."
        );
        return;
      }

      setImportConfirmBusy(
        true
      );

      setImportErr("");

      try {
        const resolveDuplicates:
          Record<
            string,
            "skip" | "overwrite"
          > = {};

        for (
          const row of
          importData.rows
        ) {
          if (
            row.status ===
            "duplicate"
          ) {
            resolveDuplicates[
              String(
                row.rowNumber
              )
            ] =
              duplicateResolution[
                row.rowNumber
              ] || "skip";
          }
        }

        const result =
          await api.post(
            "/api/dashboard/products/bulk/confirm",
            {
              importId:
                importData.importId,

              resolveDuplicates,
            }
          );

        toast.success(
          `Import complete — ${result.created?.length || 0} created, ${result.overwritten?.length || 0} overwritten.`
        );

        setImportOpen(false);
        setImportData(null);
        setDuplicateResolution(
          {}
        );

        await load();
      } catch (e: any) {
        setImportErr(
          e?.message ||
            "Couldn't confirm the import."
        );
      } finally {
        setImportConfirmBusy(
          false
        );
      }
    };

  /*
   * ---------------------------------------------------------------------------
   * CSV TEMPLATE
   * ---------------------------------------------------------------------------
   */

  const downloadCsvTemplate =
    () => {
      const csv = [
        "name,price,costPrice,description,images,coverImageUrl,categoryId,unitId,initialStock",

        'Agbalumo,1500,1000,"Fresh agbalumo","https://example.com/agbalumo.jpg",https://example.com/agbalumo.jpg,,,',
      ].join("\n");

      const blob =
        new Blob(
          [csv],
          {
            type:
              "text/csv;charset=utf-8;",
          }
        );

      const url =
        URL.createObjectURL(
          blob
        );

      const link =
        document.createElement(
          "a"
        );

      link.href = url;
      link.download =
        "products-import-template.csv";

      link.click();

      URL.revokeObjectURL(
        url
      );
    };

  /*
   * ---------------------------------------------------------------------------
   * CATEGORY LOOKUP
   * ---------------------------------------------------------------------------
   */

  const catName = useMemo(() => {
    const map: Record<
      string,
      string
    > = {};

    cats.forEach(
      (category) => {
        map[category.id] =
          category.name;
      }
    );

    return (
      id: string
    ) => map[id] || "";
  }, [cats]);

  /*
   * ---------------------------------------------------------------------------
   * LOADING
   * ---------------------------------------------------------------------------
   */

  if (loading) {
    return (
      <div>
        <PageHead
          title="Products"
          sub="Your catalog — what you sell in the shop and online."
        />

        <div className="grid gap-3">
          {Array.from({
            length: 6,
          }).map((_, i) => (
            <div
              key={i}
              className="skeleton h-16"
            />
          ))}
        </div>
      </div>
    );
  }

  /*
   * ---------------------------------------------------------------------------
   * MAIN PAGE
   * ---------------------------------------------------------------------------
   */

  return (
    <div>
      <PageHead
        title="Products"
        sub={`${total} products · money in ${currency}`}
      >
        <div className="flex gap-2">
          <Button
            variant="outline"
            icon="upload"
            onClick={openImport}
          >
            Bulk import
          </Button>

          <Button
            icon="plus"
            onClick={openCreate}
          >
            New product
          </Button>
        </div>
      </PageHead>

      {error ? (
        <div className="card">
          <ErrorState
            message={error}
            onRetry={() =>
              load()
            }
          />
        </div>
      ) : items.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="box"
            title="No products yet"
            hint="Add a product or import your catalog in bulk."
            action={
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  icon="upload"
                  onClick={
                    openImport
                  }
                >
                  Bulk import
                </Button>

                <Button
                  icon="plus"
                  onClick={
                    openCreate
                  }
                >
                  Add your first product
                </Button>
              </div>
            }
          />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto scrollbar-slim">
            <table className="tbl">
              <thead>
                <tr>
                  <th>
                    Product
                  </th>

                  <th>
                    Category
                  </th>

                  <th className="text-right">
                    Price
                  </th>

                  <th className="text-right">
                    Stock
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Expiry
                  </th>

                  <th className="text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {items.map(
                  (product) => {
                    const variants =
                      product.variants ||
                      [];

                    const low =
                      product.lowStockThreshold !=
                        null &&
                      Number(
                        product.quantity ||
                          0
                      ) <=
                        Number(
                          product.lowStockThreshold
                        );

                    return (
                      <tr
                        key={
                          product.id
                        }
                      >
                        <td>
                          <div className="flex items-center gap-3">
                            <Thumb
                              src={
                                product.coverImageUrl ||
                                product
                                  .images?.[0]
                              }
                              alt={
                                product.name
                              }
                              className="h-10 w-10"
                            />

                            <div className="min-w-0">
                              <p className="max-w-[220px] truncate font-bold">
                                {
                                  product.name
                                }
                              </p>

                              {product.sku && (
                                <p className="text-xs text-ink-400">
                                  {
                                    product.sku
                                  }
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="whitespace-nowrap text-ink-500">
                          {product
                            .category
                            ?.name ||
                            catName(
                              product.categoryId
                            ) ||
                            "—"}
                        </td>

                        <td className="whitespace-nowrap text-right">
                          <Money
                            v={
                              product.discountPrice ??
                              product.price
                            }
                            currency={
                              currency
                            }
                            strong
                          />

                          {product.discountPrice !=
                            null && (
                            <span className="ml-1.5 text-xs text-ink-300 line-through">
                              {fmSafe(
                                product.price,
                                currency
                              )}
                            </span>
                          )}
                        </td>

                        <td className="whitespace-nowrap text-right">
                          {variants.length ? (
                            <span className="text-xs font-bold text-ink-500">
                              {
                                variants.length
                              }{" "}
                              variants
                            </span>
                          ) : (
                            <span
                              className={cls(
                                "font-bold tabular-nums",
                                low &&
                                  "text-gold-600"
                              )}
                            >
                              {
                                product.quantity
                              }
                            </span>
                          )}
                        </td>

                        <td>
                          <span
                            className={cls(
                              "inline-flex rounded-full px-2.5 py-1 text-xs font-bold",

                              product.status ===
                                "PUBLISHED"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600"
                            )}
                          >
                            {product.status ===
                            "PUBLISHED"
                              ? "Published"
                              : "Draft"}
                          </span>
                        </td>

                        <td className="whitespace-nowrap text-xs text-ink-500">
                          {product.expiryDate
                            ? fd(
                                product.expiryDate
                              )
                            : "—"}
                        </td>

                        <td>
                          <div className="flex items-center justify-end gap-0.5">
                            <IconBtn
                              name="edit"
                              label="Edit"
                              onClick={() =>
                                openEdit(
                                  product
                                )
                              }
                            />

                            <IconBtn
                              name={
                                product.status ===
                                "PUBLISHED"
                                  ? "eye"
                                  : "store"
                              }
                              label={
                                product.status ===
                                "PUBLISHED"
                                  ? "Unpublish"
                                  : "Publish"
                              }
                              onClick={() =>
                                toggleStatus(
                                  product
                                )
                              }
                            />

                            <IconBtn
                              name="trash"
                              label="Delete"
                              className="hover:bg-danger-100 hover:text-danger-500"
                              onClick={() =>
                                setDelFor(
                                  product
                                )
                              }
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>

          <LoadMore
            onClick={() =>
              load(
                nextCursor
              )
            }
            loading={
              loadingMore
            }
            hasMore={
              !!nextCursor
            }
          />
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* CREATE / EDIT                                                       */}
      {/* ------------------------------------------------------------------ */}

      <Modal
        open={formOpen}
        onClose={() =>
          setFormOpen(false)
        }
        title={
          editing
            ? `Edit — ${editing.name}`
            : "New product"
        }
        sub={
          editing
            ? "Update the product details."
            : "Products start as drafts. Publish when ready."
        }
        wide
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() =>
                setFormOpen(
                  false
                )
              }
            >
              Cancel
            </Button>

            <Button
              loading={
                formBusy
              }
              onClick={
                submitForm
              }
              icon="check"
            >
              {editing
                ? "Save changes"
                : "Create product"}
            </Button>
          </>
        }
      >
        {formErr && (
          <div className="mb-4 rounded-xl border border-danger-100 bg-danger-100/60 px-3.5 py-3 text-sm font-semibold text-danger-700">
            <Icon
              name="alert"
              size={16}
              className="mr-2 inline"
            />

            {formErr}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Name"
            className="sm:col-span-2"
          >
            <Input
              value={
                form.name
              }
              maxLength={
                MAX_PRODUCT_NAME
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  name:
                    e.target.value,
                })
              }
              placeholder="e.g. Agbalumo"
              autoFocus
            />
          </Field>

          <Field
            label="SKU"
            hint="Optional, up to 64 characters."
          >
            <Input
              value={
                form.sku
              }
              maxLength={
                MAX_PRODUCT_SKU
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  sku:
                    e.target.value,
                })
              }
              placeholder="AGB-001"
            />
          </Field>

          <Field
            label={`Selling price (${currency})`}
          >
            <Input
              type="number"
              min="0"
              step="0.01"
              value={
                form.price
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  price:
                    e.target.value,
                })
              }
              placeholder="0.00"
            />
          </Field>

          <Field
            label={`Cost price (${currency})`}
          >
            <Input
              type="number"
              min="0"
              step="0.01"
              value={
                form.costPrice
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  costPrice:
                    e.target.value,
                })
              }
              placeholder="0.00"
            />
          </Field>

          <Field
            label={`Discount price (${currency})`}
          >
            <Input
              type="number"
              min="0"
              step="0.01"
              value={
                form.discountPrice
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  discountPrice:
                    e.target.value,
                })
              }
              placeholder="0.00"
            />
          </Field>

          {!editing &&
            form.variantRows.filter(
              (v) =>
                v.name.trim()
            ).length === 0 && (
              <Field
                label="Initial stock"
                hint="1–1,000,000. Create-only."
              >
                <Input
                  type="number"
                  min="1"
                  max="1000000"
                  value={
                    form.initialStock
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      initialStock:
                        e.target.value,
                    })
                  }
                  placeholder="0"
                />
              </Field>
            )}

          <Field label="Category">
            <Select
              value={
                form.categoryId
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  categoryId:
                    e.target.value,
                })
              }
            >
              <option value="">
                No category
              </option>

              {cats.map((c) => (
                <option
                  key={c.id}
                  value={c.id}
                >
                  {c.name}
                </option>
              ))}

              <option value="__new">
                + New category…
              </option>
            </Select>
          </Field>

          {form.categoryId ===
            "__new" && (
            <Field label="New category name">
              <Input
                value={newCat}
                onChange={(e) =>
                  setNewCat(
                    e.target.value
                  )
                }
                placeholder="e.g. Beverages"
              />
            </Field>
          )}

          <Field label="Unit">
            <Select
              value={
                form.unitId
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  unitId:
                    e.target.value,
                })
              }
            >
              <option value="">
                No unit
              </option>

              {units.map((u) => (
                <option
                  key={u.id}
                  value={u.id}
                >
                  {u.name}
                  {u.symbol
                    ? ` (${u.symbol})`
                    : ""}
                </option>
              ))}

              <option value="__new">
                + New unit…
              </option>
            </Select>
          </Field>

          {form.unitId ===
            "__new" && (
            <Field label="New unit name">
              <Input
                value={newUnit}
                onChange={(e) =>
                  setNewUnit(
                    e.target.value
                  )
                }
                placeholder="e.g. carton"
              />
            </Field>
          )}

          <Field
            label="Low-stock threshold"
            hint="Optional integer."
          >
            <Input
              type="number"
              min="0"
              value={
                form.lowStockThreshold
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  lowStockThreshold:
                    e.target.value,
                })
              }
              placeholder="e.g. 5"
            />
          </Field>

          <Field
            label="Expiry date"
            hint="Optional."
          >
            <Input
              type="date"
              value={
                form.expiryDate
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  expiryDate:
                    e.target.value,
                })
              }
            />
          </Field>

          <Field
            label="Description"
            className="sm:col-span-2"
          >
            <Textarea
              value={
                form.description
              }
              maxLength={
                MAX_DESCRIPTION
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  description:
                    e.target.value,
                })
              }
              placeholder="What customers should know…"
            />
          </Field>
        </div>

        {/* Images */}

        <div className="mt-5">
          <label className="lbl">
            Photos (max {MAX_IMAGES})
          </label>

          <div className="flex flex-wrap gap-2.5">
            {form.images.map(
              (
                src,
                index
              ) => (
                <div
                  key={`${src}-${index}`}
                  className="group relative"
                >
                  <Thumb
                    src={src}
                    className="h-16 w-16"
                  />

                  {index ===
                    0 && (
                    <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 rounded-full bg-ink-900 px-1.5 py-px text-[9px] font-extrabold uppercase text-cream-50">
                      Cover
                    </span>
                  )}

                  <button
                    type="button"
                    className="absolute -right-1.5 -top-1.5 hidden h-5 w-5 items-center justify-center rounded-full bg-danger-500 text-white group-hover:flex"
                    onClick={() =>
                      setForm(
                        (
                          current
                        ) => ({
                          ...current,
                          images:
                            current.images.filter(
                              (
                                _,
                                i
                              ) =>
                                i !==
                                index
                            ),
                        })
                      )
                    }
                  >
                    <Icon
                      name="x"
                      size={10}
                    />
                  </button>
                </div>
              )
            )}

            <input
              ref={
                fileRef
              }
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              hidden
              onChange={(e) =>
                handleFiles(
                  e.target.files
                )
              }
            />

            <Button
              variant="outline"
              size="sm"
              icon="upload"
              loading={
                uploading
              }
              disabled={
                form.images
                  .length >=
                MAX_IMAGES
              }
              onClick={() =>
                fileRef.current?.click()
              }
            >
              Upload
            </Button>
          </div>

          <div className="mt-2.5 flex gap-2">
            <Input
              value={
                imageUrl
              }
              onChange={(e) =>
                setImageUrl(
                  e.target.value
                )
              }
              placeholder="Or paste an image URL"
              className="flex-1"
              disabled={
                form.images
                  .length >=
                MAX_IMAGES
              }
            />

            <Button
              variant="ghost"
              onClick={
                addImageUrl
              }
              disabled={
                form.images
                  .length >=
                MAX_IMAGES
              }
            >
              Add
            </Button>
          </div>
        </div>

        {/* Variants */}

        <div className="mt-5">
          <div className="flex items-center justify-between">
            <label className="lbl !mb-0">
              Variants
            </label>

            {!editing && (
              <Button
                variant="ghost"
                size="sm"
                icon="plus"
                disabled={
                  form.variantRows
                    .length >=
                  MAX_VARIANTS
                }
                onClick={() =>
                  setForm(
                    (
                      current
                    ) => ({
                      ...current,
                      variantRows:
                        [
                          ...current.variantRows,
                          {
                            key:
                              Date.now(),
                            name: "",
                            sellingPrice:
                              "",
                            sku: "",
                            initialStock:
                              "",
                          },
                        ],
                      initialStock:
                        "",
                    })
                  )
                }
              >
                Add variant
              </Button>
            )}
          </div>

          <p className="mb-2 mt-1 text-xs text-ink-400">
            {editing
              ? "Variants are create-only and cannot be changed."
              : "Variants are create-only. Maximum 50."}
          </p>

          {form.variantRows.map(
            (variant) => (
              <div
                key={
                  variant.key
                }
                className="mb-2 flex flex-wrap items-center gap-2 rounded-xl bg-cream-100 p-2"
              >
                <Input
                  className="w-40 flex-1"
                  placeholder="Variant name"
                  value={
                    variant.name
                  }
                  disabled={
                    !!editing
                  }
                  onChange={(
                    e
                  ) =>
                    setForm(
                      (
                        current
                      ) => ({
                        ...current,
                        variantRows:
                          current.variantRows.map(
                            (
                              row
                            ) =>
                              row.key ===
                              variant.key
                                ? {
                                    ...row,
                                    name:
                                      e
                                        .target
                                        .value,
                                  }
                                : row
                          ),
                      })
                    )
                  }
                />

                <Input
                  className="w-28"
                  placeholder="Price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    variant.sellingPrice
                  }
                  disabled={
                    !!editing
                  }
                  onChange={(
                    e
                  ) =>
                    setForm(
                      (
                        current
                      ) => ({
                        ...current,
                        variantRows:
                          current.variantRows.map(
                            (
                              row
                            ) =>
                              row.key ===
                              variant.key
                                ? {
                                    ...row,
                                    sellingPrice:
                                      e
                                        .target
                                        .value,
                                  }
                                : row
                          ),
                      })
                    )
                  }
                />

                <Input
                  className="w-24"
                  placeholder="SKU"
                  maxLength={
                    MAX_PRODUCT_SKU
                  }
                  value={
                    variant.sku
                  }
                  disabled={
                    !!editing
                  }
                  onChange={(e) =>
                    setForm(
                      (
                        current
                      ) => ({
                        ...current,
                        variantRows:
                          current.variantRows.map(
                            (
                              row
                            ) =>
                              row.key ===
                              variant.key
                                ? {
                                    ...row,
                                    sku:
                                      e
                                        .target
                                        .value,
                                  }
                                : row
                          ),
                      })
                    )
                  }
                />

                {!editing && (
                  <Input
                    className="w-24"
                    placeholder="Initial stock"
                    type="number"
                    min="1"
                    max="1000000"
                    value={
                      variant.initialStock
                    }
                    onChange={(
                      e
                    ) =>
                      setForm(
                        (
                          current
                        ) => ({
                          ...current,
                          variantRows:
                            current.variantRows.map(
                              (
                                row
                              ) =>
                                row.key ===
                                variant.key
                                  ? {
                                      ...row,
                                      initialStock:
                                        e
                                          .target
                                          .value,
                                    }
                                  : row
                            ),
                        })
                      )
                    }
                  />
                )}

                {!editing && (
                  <IconBtn
                    name="trash"
                    label="Remove variant"
                    onClick={() =>
                      setForm(
                        (
                          current
                        ) => ({
                          ...current,
                          variantRows:
                            current.variantRows.filter(
                              (
                                row
                              ) =>
                                row.key !==
                                variant.key
                            ),
                        })
                      )
                    }
                  />
                )}
              </div>
            )
          )}
        </div>
      </Modal>

      {/* ------------------------------------------------------------------ */}
      {/* BULK IMPORT MODAL                                                   */}
      {/* ------------------------------------------------------------------ */}

      <Modal
        open={
          importOpen
        }
        onClose={
          closeImport
        }
        title="Bulk import products"
        sub={
          importData
            ? "Review the preview before confirming."
            : "Upload a CSV containing up to 500 products."
        }
        wide
        footer={
          <>
            <Button
              variant="ghost"
              onClick={
                closeImport
              }
              disabled={
                importBusy ||
                importConfirmBusy
              }
            >
              Cancel
            </Button>

            {importData ? (
              <Button
                loading={
                  importConfirmBusy
                }
                disabled={
                  importData
                    .summary
                    .errors > 0
                }
                onClick={
                  confirmImport
                }
              >
                Confirm import
              </Button>
            ) : null}
          </>
        }
      >
        {importErr && (
          <div className="mb-4 rounded-xl border border-danger-100 bg-danger-100/60 px-3.5 py-3 text-sm font-semibold text-danger-700">
            {importErr}
          </div>
        )}

        {!importData ? (
          <div className="space-y-5">
            <div className="rounded-xl border border-ink-100 bg-cream-50 p-4">
              <h3 className="font-bold">
                CSV format
              </h3>

              <p className="mt-1 text-sm text-ink-500">
                Required columns:
                <strong>
                  {" "}
                  name, price
                </strong>
              </p>

              <p className="mt-1 text-sm text-ink-500">
                Optional columns:{" "}
                costPrice,
                description,
                images,
                coverImageUrl,
                categoryId,
                unitId,
                initialStock
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={
                  downloadCsvTemplate
                }
              >
                Download CSV template
              </Button>

              <Button
                icon="upload"
                loading={
                  importBusy
                }
                onClick={() =>
                  importFileRef.current?.click()
                }
              >
                Choose CSV file
              </Button>
            </div>

            <input
              ref={
                importFileRef
              }
              type="file"
              accept=".csv,text/csv"
              hidden
              onChange={(e) => {
                const file =
                  e.target.files?.[0];

                if (file) {
                  importCsv(
                    file
                  );
                }
              }}
            />

            <div className="text-xs text-ink-400">
              Maximum 500 rows.
              This step does
              not write anything
              to the database.
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-4">
              <div className="rounded-xl bg-cream-100 p-3">
                <p className="text-xs text-ink-400">
                  New
                </p>

                <p className="text-xl font-bold">
                  {
                    importData
                      .summary
                      .new
                  }
                </p>
              </div>

              <div className="rounded-xl bg-cream-100 p-3">
                <p className="text-xs text-ink-400">
                  Duplicates
                </p>

                <p className="text-xl font-bold">
                  {
                    importData
                      .summary
                      .duplicates
                  }
                </p>
              </div>

              <div className="rounded-xl bg-cream-100 p-3">
                <p className="text-xs text-ink-400">
                  Errors
                </p>

                <p className="text-xl font-bold">
                  {
                    importData
                      .summary
                      .errors
                  }
                </p>
              </div>

              <div className="rounded-xl bg-cream-100 p-3">
                <p className="text-xs text-ink-400">
                  Expires
                </p>

                <p className="text-sm font-bold">
                  {new Date(
                    importData.expiresAt
                  ).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="max-h-[50vh] overflow-auto rounded-xl border border-ink-100">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>
                      Row
                    </th>

                    <th>
                      Product
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Details
                    </th>

                    <th>
                      Duplicate action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {importData.rows.map(
                    (row) => (
                      <tr
                        key={
                          row.rowNumber
                        }
                      >
                        <td>
                          {
                            row.rowNumber
                          }
                        </td>

                        <td>
                          {row.product
                            ?.name ||
                            row.existingName ||
                            "—"}
                        </td>

                        <td>
                          <span
                            className={cls(
                              "inline-flex rounded-full px-2 py-1 text-xs font-bold",

                              row.status ===
                                "new" &&
                                "bg-green-100 text-green-700",

                              row.status ===
                                "duplicate" &&
                                "bg-yellow-100 text-yellow-700",

                              row.status ===
                                "error" &&
                                "bg-red-100 text-red-700"
                            )}
                          >
                            {
                              row.status
                            }
                          </span>
                        </td>

                        <td className="max-w-[300px] text-xs text-ink-500">
                          {row.errors
                            ?.length
                            ? row.errors.join(
                                ", "
                              )
                            : row.status ===
                                "duplicate"
                              ? `Existing product: ${row.existingName || "unknown"}`
                              : "Ready to import"}
                        </td>

                        <td>
                          {row.status ===
                          "duplicate" ? (
                            <Select
                              value={
                                duplicateResolution[
                                  row
                                    .rowNumber
                                ] ||
                                "skip"
                              }
                              onChange={(
                                e
                              ) =>
                                setDuplicateResolution(
                                  (
                                    current
                                  ) => ({
                                    ...current,

                                    [row.rowNumber]:
                                      e
                                        .target
                                        .value as
                                        | "skip"
                                        | "overwrite",
                                  })
                                )
                              }
                            >
                              <option value="skip">
                                Skip
                              </option>

                              <option value="overwrite">
                                Overwrite
                              </option>
                            </Select>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {importData
              .summary
              .errors > 0 && (
              <div className="rounded-xl border border-danger-100 bg-danger-100/60 p-3 text-sm font-semibold text-danger-700">
                Fix the error
                rows and run the
                preview again.
                Error rows cannot
                be confirmed.
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ------------------------------------------------------------------ */}
      {/* DELETE                                                              */}
      {/* ------------------------------------------------------------------ */}

      <Confirm
        open={
          !!delFor
        }
        onClose={() =>
          setDelFor(null)
        }
        onConfirm={
          confirmDelete
        }
        loading={
          delBusy
        }
        title={`Delete “${
          delFor?.name || ""
        }”?`}
        body="This soft-deletes the product. Existing order and ledger history remains intact."
        confirmLabel="Delete product"
      />
    </div>
  );
}

function fmSafe(
  value: any,
  currency: string
) {
  try {
    return new Intl.NumberFormat(
      "en",
      {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
      }
    ).format(
      Number(value)
    );
  } catch {
    return String(
      value ?? ""
    );
  }
}
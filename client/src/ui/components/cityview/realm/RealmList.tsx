import { useDeferredValue, useEffect, useMemo, useState } from "react";
import useRealmStore from "../../../../hooks/store/useRealmStore";
import { SelectableRealmInterface } from "@bibliothecadao/eternum";
import { OrderIcon } from "../../../elements/OrderIcon";
import { SortButton, SortInterface } from "../../../elements/SortButton";
import { SortPanel } from "../../../elements/SortPanel";
import { ReactComponent as CaretDownFill } from "@/assets/icons/common/caret-down-fill.svg";
import TextInput from "../../../elements/TextInput";
import { removeAccents } from "../../../utils/utils";

export const RealmList = ({
  selectedRealmEntityId,
  setSelectedRealmEntityId,
  selectableRealms,
  title = "",
}: {
  selectedRealmEntityId: bigint | undefined;
  setSelectedRealmEntityId: (selectedRealmEntityId: bigint) => void;
  selectableRealms: SelectableRealmInterface[];
  title?: string | undefined;
}) => {
  const [specifyRealmId, setSpecifyRealmId] = useState(false);
  const [nameFilter, setNameFilter] = useState("");
  const [sortedRealms, setSortedRealms] = useState<SelectableRealmInterface[]>([]);
  const deferredNameFilter = useDeferredValue(nameFilter);

  const realmEntityId = useRealmStore((state) => state.realmEntityId);

  const sortingParams = useMemo(() => {
    return [
      { label: "Order", sortKey: "order" },
      { label: "Realm ID", sortKey: "id", className: "ml-4" },
      { label: "Realm", sortKey: "name", className: "ml-4 mr-4" },
      { label: "Name", sortKey: "addressName", className: "ml-4 mr-4" },
      { label: "Distance", sortKey: "distance", className: "ml-auto" },
    ];
  }, []);

  const [activeSort, setActiveSort] = useState<SortInterface>({
    sortKey: "number",
    sort: "none",
  });

  useEffect(() => {
    const sorted = sortRealms(selectableRealms, activeSort);
    if (nameFilter.length > 0) {
      const filtered = sorted.filter((realm) => {
        const name = removeAccents(realm.name.toLowerCase());
        return name.includes(deferredNameFilter.toLowerCase()) || realm.realmId.toString().includes(deferredNameFilter);
      });
      // sort Realms by index of the name filter
      filtered.sort((a, b) => {
        const nameA = removeAccents(a.name.toLowerCase());
        const nameB = removeAccents(b.name.toLowerCase());
        const filter = deferredNameFilter.toLowerCase();
        return nameA.indexOf(filter) - nameB.indexOf(filter);
      });
      setSortedRealms(filtered);
      return;
    }
    setSortedRealms(sorted);
  }, [selectableRealms, activeSort, deferredNameFilter]);

  const selectedRealm = useMemo(() => {
    return sortedRealms.find((realm) => realm.entityId === selectedRealmEntityId);
  }, [sortedRealms, selectedRealmEntityId]);

  return (
    <div className="flex flex-col items-center w-full p-2">
      {!specifyRealmId && (
        <div
          onClick={() => setSpecifyRealmId(true)}
          className="relative w-full mx-4 h-8 py-[7px] bg-dark-brown cursor-pointer rounded justify-center items-center box-border"
        >
          {!selectedRealmEntityId ? (
            <div className="text-xs text-center text-gold"> + {title}</div>
          ) : (
            <div className="text-xs text-center text-gold">
              {title} for:
              <span className="text-light-pink"> {selectedRealm?.name}</span>
            </div>
          )}
          <CaretDownFill className="ml-1 fill-gold absolute top-1/2 right-2 -translate-y-1/2" />
        </div>
      )}
      {specifyRealmId && (
        <div className="flex flex-col p-1 rounded border-gold border w-full box-content">
          <div
            onClick={() => setSpecifyRealmId(false)}
            className="w-full p-2 mb-1 -mt-1 relative cursor-pointer rounded justify-center items-center"
          >
            <div className="text-xs text-center text-gold">{title}</div>
            <CaretDownFill className="ml-1 fill-gold absolute top-1/2 right-2 -translate-y-1/2 rotate-180" />
          </div>
          {realmEntityId.toString() && (
            <div className="flex flex-col">
              <TextInput
                className="border border-gold mx-1 !w-auto !text-light-pink text-xs"
                placeholder="Search by ID or name"
                value={nameFilter}
                onChange={setNameFilter}
              />
              <SortPanel className="px-2 py-2 border-b-0">
                {sortingParams.map(({ label, sortKey, className }) => (
                  <SortButton
                    className={className}
                    key={sortKey}
                    label={label}
                    sortKey={sortKey}
                    activeSort={activeSort}
                    onChange={(_sortKey, _sort) => {
                      setActiveSort({
                        sortKey: _sortKey,
                        sort: _sort,
                      });
                    }}
                  />
                ))}
              </SortPanel>
              <div className="flex flex-col px-1 mb-1 space-y-2 max-h-40 overflow-y-auto">
                {sortedRealms.map(
                  ({ order, name, addressName, entityId: takerRealmEntityId, realmId: takerRealmId, distance }, i) => {
                    return (
                      <div
                        key={i}
                        className={`flex cursor-pointer flex-col p-2 bg-black border border-transparent transition-all duration-200 rounded-md ${
                          selectedRealmEntityId === takerRealmEntityId ? "!border-order-brilliance" : ""
                        } text-xxs text-gold`}
                        onClick={() => {
                          if (selectedRealmEntityId !== takerRealmEntityId) {
                            setSelectedRealmEntityId(takerRealmEntityId);
                          } else {
                            setSelectedRealmEntityId(0n);
                          }
                        }}
                      >
                        <div className="flex items-center justify-between text-xxs">
                          <div className="flex-none text-left w-20">
                            <OrderIcon order={order} size="xs" />
                          </div>

                          <div className="flex-none w-10">{Number(takerRealmId)}</div>

                          <div className="flex-none text-left w-20">{name}</div>

                          <div className="flex-grow">{addressName}</div>

                          <div className="flex-none w-16 text-right">{`${distance.toFixed(0)} km`}</div>
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * sort realms based on active filters
 */
export function sortRealms(realms: SelectableRealmInterface[], activeSort: SortInterface): SelectableRealmInterface[] {
  const sortedRealms = [...realms]; // Making a copy of the realms array

  if (activeSort.sort !== "none") {
    if (activeSort.sortKey === "id") {
      return sortedRealms.sort((a, b) => {
        if (activeSort.sort === "asc") {
          return Number(a.realmId - b.realmId);
        } else {
          return Number(b.realmId - a.realmId);
        }
      });
    } else if (activeSort.sortKey === "name") {
      return sortedRealms.sort((a, b) => {
        if (activeSort.sort === "asc") {
          return a.name.localeCompare(b.name);
        } else {
          return b.name.localeCompare(a.name);
        }
      });
    } else if (activeSort.sortKey === "addressName") {
      return sortedRealms.sort((a, b) => {
        if (activeSort.sort === "asc") {
          return a.addressName.localeCompare(b.addressName);
        } else {
          return b.addressName.localeCompare(a.addressName);
        }
      });
    } else if (activeSort.sortKey === "distance") {
      return sortedRealms.sort((a, b) => {
        if (activeSort.sort === "asc") {
          return a.distance - b.distance;
        } else {
          return b.distance - a.distance;
        }
      });
    } else if (activeSort.sortKey === "order") {
      return sortedRealms.sort((a, b) => {
        if (activeSort.sort === "asc") {
          return a.order.localeCompare(b.order);
        } else {
          return b.order.localeCompare(a.order);
        }
      });
    } else {
      return sortedRealms;
    }
  } else {
    return sortedRealms.sort((a, b) => Number(b.realmId - a.realmId));
  }
}

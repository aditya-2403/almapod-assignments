import React, { useState, useEffect } from "react";
import styles from "./AllPolicy.module.css";
import { BodyLayout } from "../../../../layouts";
import { CardContainer, Select } from "@aiaplus/aiaplus-web-base";
import Image from 'next/image';
import { IMAGES } from '../../../../utils/Images';
import api from "../../../../services";
import apiPaths from "../../../../config/Apipath";
import aiaLogo from "@aia-dds/assets/images/logos/aia-logo-red.svg";
import PolicyTable from "../../../../component/PolicyTable";
import CustomLink from "../../../../component/CustomLink";
import Pagination from "../../../../component/Pagination/Pagination";
import { Modal, Button } from "@aiaplus/aiaplus-web-base";
import { ENV_IMPORTS, getStatusDescription, PortfolioCoverageChipBackgroundColors, PortfolioCoverageChipColors } from "../../../../utils/Constant";
import policyData from '@/pages/common/mock/policy.json';

interface FilterCriteria {
    coverageChipDetails: string | string[] | undefined;
    insured: string;
    benefit: string;
    status: string[];
}

interface Policy {
    policies: string;
    policyNumber: string;
    status: string;
    insured: string[];
    premiumAmount: number;
    nextPreDueDate: string;
    todo: string;
    coverageChipDetails: any;
    [key: string]: any;
}

const AllPolicies: React.FC = () => {
    const [policies, setPolicies] = useState<Policy[]>([]);
    const [polType, setPolType] = useState("");
    const [currency, setCurrency] = useState("");
    const [filteredPolicies, setFilteredPolicies] = useState<Policy[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [recordsPerPage, setRecordsPerPage] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [filterCriteria, setFilterCriteria] = useState<FilterCriteria>({
        coverageChipDetails: "",
        insured: "",
        benefit: "",
        status: []
    });
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [allPoliciesForFilter, setAllPoliciesForFilter] = useState<Policy[]>([]);

    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const totalPages = Math.ceil(totalCount / recordsPerPage);

    // Calculate number of active filters
    const activeFilterCount = [
        filterCriteria.insured ? 1 : 0,
        filterCriteria.benefit ? 1 : 0,
        filterCriteria.status.length
    ].reduce((a, b) => a + b, 0);

    const columns = [
        {
            title: 'Policies',
            dataIndex: 'policyName',
            key: 'policyName',
            sortable: true,
            customWidth: '16%',
            render: (value: string, record: Policy) => {
                const displayValue = value || "Mock Policy Name";
                return (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <Image
                      src={aiaLogo}
                      alt="Logo"
                      style={{ height: '60px', width: '60px', marginTop: '-12px' }}
                    />
                    <div>
                      <CustomLink
                        onClick={() => handlePolicyClick(record.policyNo)}
                        label={[displayValue]}
                        showArrow={true}
                      />
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                        {record.coverageChipDetails?.map((detail, index) => {
                          const chipCode = record.chipCode?.[index];
              
                          const bgColor =
                            PortfolioCoverageChipBackgroundColors[chipCode] || "#E7E5ED";
              
                          const textColor =
                          PortfolioCoverageChipColors[chipCode] || "#4C4794";
              
                          return (
                            <span
                              key={index}
                              style={{
                                fontFamily: 'Open Sans',
                                fontStyle: 'normal',
                                fontWeight: 600,
                                fontSize: '12px',
                                lineHeight: '18px',
                                letterSpacing: '0.1px',
                                color: textColor.startsWith("#") ? textColor : `#${textColor}`,
                                backgroundColor:
                                  bgColor.startsWith("#") || bgColor.startsWith("rgba")
                                    ? bgColor
                                    : `#${bgColor}`,
                                padding: '2px 12px 4px',
                                borderRadius: '16px',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {detail}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              }
              
        },
        {
            title: (
                <span
                    dangerouslySetInnerHTML={{
                        __html: "Policy  <br/>number",
                    }}
                />
            ),
            dataIndex: 'policyNo',
            key: 'policyNo',
            sortable: true,
            customWidth: '12%',
            render: (value: string) => <>{value}</>,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            customWidth: '12%',
            key: 'status',
            sortable: true,
            render: (value: string, record: any) => {
                const statusDesc = getStatusDescription(value);
                const displayText = statusDesc?.trim() ? statusDesc : record?.polStatusDescr;

                return (
                    <div style={{ display: 'flex', gap: '6px' }}>
                        <div
                            style={{
                                marginTop: '8px',
                                width: '8px',
                                height: '8px',
                                background:
                                    displayText?.toLowerCase() === 'inforce' ? '#3DA758' : '#F7C926',
                                borderRadius: '50%',
                                flex: 'none',
                                order: 0,
                                flexGrow: 0,
                            }}
                        />
                        <p
                            style={{
                                margin: 0,
                                wordWrap: 'break-word',
                                overflowWrap: 'break-word',
                                whiteSpace: 'normal',
                            }}
                        >
                            {displayText}
                        </p>
                    </div>
                );
            }
        },
        {
            title: 'Insured',
            dataIndex: 'insured',
            key: 'insured',
            customWidth: '16%',
            sortable: true,
            render: (value: string[]) => {
                if (!Array.isArray(value)) return <>{value}</>;

                const toggleExpanded = () => setExpanded(!expanded);

                return (
                    <div>
                        {expanded
                            ? value.map((name, index) => <div key={index}>{name}</div>)
                            : <div>{value[0]}</div>}

                        {value.length > 1 && (
                            <div
                                onClick={toggleExpanded}
                                style={{
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    marginTop: '4px',
                                    gap: '6px'
                                }}
                            >
                                <span style={{ color: '#D31145', fontWeight: '500' }}>
                                    {expanded ? 'See less' : `See all (${value.length})`}
                                </span>
                                <Image
                                    src={IMAGES.SEE_ALL}
                                    alt="not found"
                                    style={{
                                        transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                    }}
                                />
                            </div>
                        ) || '-'}
                    </div>
                );
            },
        },
        {
            title: (
                <span
                    dangerouslySetInnerHTML={{
                        __html: "Premium  <br/>amount",
                    }}
                />
            ),
            dataIndex: 'premAmt',
            key: 'premAmt',
            customWidth: '10%',
            sortable: true,
            render: (value) => {
                if(Number(value)=== 0) {
                    return <>-</>;
                }
        
                const formattedValue = Number(value).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                });
        
                return <>{currency ? `${currency} ${formattedValue}` : formattedValue}</>;
            },
        },
        
        {
            title: (
                <span
                    dangerouslySetInnerHTML={{
                        __html: "Next Premium  <br/>due date",
                    }}
                />
            ),
            dataIndex: 'nextPremDueDate',
            key: 'nextPremDueDate',
            customWidth: '15%',
            sortable: true,
            render: (value: string) => {
                if (!value) return <>-</>;

                const date = new Date(value);
                const formatted = new Intl.DateTimeFormat('en-SG', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                }).format(date);

                return <>{formatted}</>;
            }
        },
        {
            title: 'To do',
            dataIndex: 'todo',
            customWidth: '25%',
            key: 'todo',
            render: (value: string) => <p className="text-danger" style={{ wordWrap: 'break-word', overflowWrap: 'break-word', whiteSpace: 'normal' }}>{value || '-'}</p>,
        },
    ];

    useEffect(() => {
        const getTableData = async (pageNo: number = currentPage, pageSize: number = recordsPerPage) => {
            const BASE_PATH =
                typeof window !== "undefined" && window.location.pathname.includes("/dev")
                    ? "/dev"
                    : "";

            try {
                setLoading(true);
                const FINAL_API_URL = `${BASE_PATH}/api/storePolicy`;

                const responsePayload = await fetch(FINAL_API_URL, { method: 'GET' });
                const searchPayload = await responsePayload.json();
                
                // Add pagination parameters to the payload
                const paginatedPayload = {
                    ...searchPayload,
                    pageNo: pageNo,
                    pageSize: pageSize
                };

                if (searchPayload.polType == "V") {
                    setPolType(searchPayload.polType);
                }
                
                const apiResponse = await api.post(apiPaths.GET_ALL_POLICY_TABLE, paginatedPayload);
                if (apiResponse.data.success) {
                    setPolicies(apiResponse.data.data);
                    setCurrency(apiResponse.data.data[0]?.currencyCd);
                    setFilteredPolicies(apiResponse.data.data);
                    
                    // Set total count from API response (assuming it's in the first item or response metadata)
                    // You may need to adjust this based on where totalCount is actually returned in your API
                    if (apiResponse.data.totalCount) {
                        setTotalCount(apiResponse.data.totalCount);
                    } else if (apiResponse.data.data[0]?.totalCount) {
                        setTotalCount(apiResponse.data.data[0].totalCount);
                    }
                    
                    // Store all policies for filter options (fetch once without pagination for filters)
                    if (pageNo === 1) {
                        const allPoliciesPayload = {
                            ...searchPayload,
                            pageNo: 1,
                            pageSize: 9999 // Large number to get all records for filter options
                        };
                        const allPoliciesResponse = await api.post(apiPaths.GET_ALL_POLICY_TABLE, allPoliciesPayload);
                        if (allPoliciesResponse.data.success) {
                            setAllPoliciesForFilter(allPoliciesResponse.data.data);
                        }
                    }
                }
            } catch (error) {
                console.log(error);
            } finally {
                setLoading(false);
            }
        };
        getTableData();
    }, [currentPage, recordsPerPage]);

    // Handle page change
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    // Handle records per page change
    const handleRecordsPerPageChange = (newRecordsPerPage: number) => {
        setRecordsPerPage(newRecordsPerPage);
        setCurrentPage(1); // Reset to first page when changing page size
    };

    const handleSearch = () => {
        let filtered = policies.filter(policy => {
            const insuredMatch = filterCriteria.insured
                ? policy?.insured?.includes(filterCriteria.insured)
                : true;
            const benefMatch = filterCriteria?.benefit
                ? policy?.coverageChipDetails?.some((detail: string) =>
                    detail.includes(filterCriteria.benefit))
                : true;
            const statusMatch = filterCriteria.status.length > 0
                ? filterCriteria.status.some(filterStatus =>
                    policy.status.toLowerCase() === filterStatus.toLowerCase())
                : true;
            return insuredMatch && statusMatch && benefMatch;
        });
        setFilteredPolicies(filtered);
        setCurrentPage(1);
        setShowModal(false);
    };
    const handleSearchbar = (query: string) => {
        setSearchQuery(query);
    };

    const handlePolicyClick = async (policyNumber: string) => {
        let targetWindow: Window | null = null;
        let childReady = false;

        const isDevEnv = typeof window !== "undefined" && window.location.pathname.includes("");


        const POLICY_BASE_PATH = isDevEnv ? "" : "";

        // const baseUrl = window.location.origin.replace(/\/+$/, "");
        const baseUrl = (ENV_IMPORTS.policyUrl || window.location.origin).replace(/\/+$/, "");

        const encodedPolicyNumber = btoa(policyNumber);
        const encodedPolType = polType ? btoa(polType) : "";

        const targetUrl = `${baseUrl}${POLICY_BASE_PATH}/pol-det?policyNumber=${encodedPolicyNumber}&polType=${encodedPolType}`;
        targetWindow = window.open(targetUrl, "_blank");

        const handleChildReady = (event: MessageEvent) => {
            if (
                event.origin === baseUrl &&
                event.data?.type === "CHILD_READY" &&
                targetWindow
            ) {
                childReady = true;
                targetWindow.postMessage(
                    {
                        type: "POLICY_DATA",
                        payload: {
                            authInfo: {
                                lanId: sessionStorage.getItem("LAN_ID"),
                                authTimestamp: sessionStorage.getItem("authTimestamp"),
                                firstLoginTimestamp: sessionStorage.getItem("firstLoginTimestamp"),
                                oktaToken: sessionStorage.getItem("okta-token-storage"),
                                con_code: sessionStorage.getItem("con_code"),
                                idleTime: sessionStorage.getItem("idleTime"),
                                oktaExpiryTime: sessionStorage.getItem("oktaExpiryTime"),
                                oktaGenerationTime: sessionStorage.getItem("oktaGenerationTime"),
                                oktaRefreshTime: sessionStorage.getItem("oktaRefreshTime"),
                            },
                        },
                    },
                    baseUrl
                );

                window.removeEventListener("message", handleChildReady);
            }
        };

        window.addEventListener("message", handleChildReady);
    };

    return (
        <BodyLayout 
            isPageLoading={loading} 
            headerTitle="All Policies" 
            isHeaderImg={false} 
            showSearchBar={true} 
            onSearch={handleSearchbar} 
            breadcrumbItems={[
                { label: "Policy", path: "/policy" },
                { label: "Policy enquiry", path: '/policy/pol-enq' },
                { label: 'All policies' }
            ]}
        >
            {/* Filter controls - always visible */}
            <div className="d-flex align-items-center justify-content-end">
                <div className="d-flex justify-content-end me-4 align-items-center">
                    <p 
                        className="text-dark cursor-pointer d-flex align-items-center" 
                        style={{ cursor: 'pointer' }} 
                        onClick={() => setShowModal(true)}
                    >
                        Filter By
                        {activeFilterCount > 0 && (
                            <span style={{ color: '#D31145', marginLeft: '4px' }}>
                                ({activeFilterCount})
                            </span>
                        )}
                        <Image 
                            src={IMAGES.FILTER_TABLE} 
                            alt="Filter" 
                            className="ms-2" 
                            style={{ width: '20px', height: '20px' }} 
                        />
                    </p>
                </div>
            </div>
    
            {/* Results section */}
            {filteredPolicies.length === 0 ? (
                <>
                    <div>
                        <p className={styles.filterNumbers}>Showing {filteredPolicies.length} of {totalCount} record{totalCount !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="d-flex justify-content-center align-items-center" style={{ height: "450px", flexDirection: "column" }}>
                        <Image alt="no-image" src={IMAGES.SEARCH_EPOINT} height={99} width={99} />
                        <p className="text-center" style={{ fontWeight: "bold", fontSize: "20px" }}>No results found</p>
                    </div>
                </>
            ) : (
                <CardContainer className={`mt-3 ms-3 me-4 ${styles.policyTableCard}`}>
                    <PolicyTable<Policy>
                        columns={columns}
                        data={filteredPolicies}
                        rowsPerPage={recordsPerPage}
                        overAllCount={totalCount}
                        onPageChange={handlePageChange}
                    />
    
                    <div>
                        <p className={styles.pagFilterNum}>Showing {((currentPage - 1) * recordsPerPage) + 1} to {Math.min(currentPage * recordsPerPage, totalCount)} of {totalCount} policies</p>
                        <Pagination
                            pagenumber={currentPage}
                            setPagenumber={handlePageChange}
                            totalPages={totalPages}
                            recordsPerPage={recordsPerPage}
                            setRecordsPerPage={handleRecordsPerPageChange}
                        />
                    </div>
                </CardContainer>
            )}
    
            {/* Filter Modal */}
            <div className="modalWrapper">
                <Modal
                    title="Filter by"
                    onClose={() => setShowModal(false)}
                    open={showModal}
                    size="x-large"
                >
                    <label className="form-label ">Insured</label>
                    <Select
                        options={[
                            ...new Set(allPoliciesForFilter?.flatMap(p => p.insured))
                        ].map(name => ({ label: name, value: name }))}
                        value={filterCriteria.insured}
                        placeholder="View all Insured"
                        onChangeValue={(val: string) => setFilterCriteria(prev => ({ ...prev, insured: val }))}
                    />
                    <div className="mb-3">
                        <label className="form-label">Benefit</label>
                        <Select
                            options={[
                                ...new Set(
                                    allPoliciesForFilter?.flatMap(p => p.coverageChipDetails || []) || []
                                )
                            ].map(benefit => ({
                                label: benefit,
                                value: benefit
                            }))}
                            value={filterCriteria.benefit}
                            placeholder="View all benefit"
                            onChangeValue={(val) =>
                                setFilterCriteria(prev => ({ ...prev, benefit: val }))
                            }
                        />
                    </div>
    
                    <div className="mb-3">
                        <label className="form-label" >Status</label>
                        <div className="row">
                            {[...new Set(allPoliciesForFilter?.map(p => p.status))].map((status, i) => (
                                <div key={status} className={`col-6 ${i > 1 ? 'mt-2' : ''}`}>
                                    <div className="form-check">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            checked={filterCriteria.status.includes(status)}
                                            onChange={() => {
                                                setFilterCriteria(prev => ({
                                                    ...prev,
                                                    status: prev.status.includes(status)
                                                        ? prev.status.filter(s => s !== status)
                                                        : [...prev.status, status]
                                                }));
                                            }}
                                        />
                                        <label className="form-check-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <div style={{ height: '6px', width: '6px', borderRadius: '50%', background: 'grey' }}></div>
                                            {status}
                                        </label>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="d-flex justify-content-between">
                        <Button
                            id="reset"
                            isFullWidth={false}
                            variant="tertiary"
                            type="button"
                            size="small"
                            label="Reset"
                            onClick={() => setFilterCriteria({ insured: "", benefit: "", status: [], coverageChipDetails: "" })}
                        />
                        <Button
                            id="showResult"
                            isFullWidth={false}
                            variant="primary"
                            type="button"
                            size="small"
                            label="Show Results"
                            onClick={handleSearch}
                        />
                    </div>
                </Modal>
            </div>
        </BodyLayout>
    );
};

export default AllPolicies;
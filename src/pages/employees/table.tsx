import * as React from 'react';
import { useTheme } from '@mui/material/styles';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableFooter from '@mui/material/TableFooter';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import IconButton from '@mui/material/IconButton';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import LastPageIcon from '@mui/icons-material/LastPage';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import LockResetIcon from '@mui/icons-material/LockReset';
import { KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material';

import { Employee } from '../../utils/info';
import AddPanel from './add';
import EditPanel from './edit';
import DeletePanel from './delete';

import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import api, { convertDateTime } from '@/utils/http_helper';

export async function getStaticProps({ locale }: { locale: string }) {
    return {
        props: {
            ...(await serverSideTranslations(locale, ['common'])),
        },
    };
}

interface TablePaginationActionsProps {
    count: number;
    page: number;
    rowsPerPage: number;
    onPageChange: (
        event: React.MouseEvent<HTMLButtonElement>,
        newPage: number,
    ) => void;
}

const StyledTableCell = styled(TableCell)(({ theme }) => ({
    [`&.${tableCellClasses.head}`]: {
        backgroundColor: theme.palette.common.black,
        color: theme.palette.common.white,
    },
    [`&.${tableCellClasses.body}`]: {
        fontSize: 14,
    },
}));

function TablePaginationActions(props: TablePaginationActionsProps) {
    const theme = useTheme();
    const { count, page, rowsPerPage, onPageChange } = props;

    const handleFirstPageButtonClick = (
        event: React.MouseEvent<HTMLButtonElement>,
    ) => {
        onPageChange(event, 0);
    };

    const handleBackButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        onPageChange(event, page - 1);
    };

    const handleNextButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        onPageChange(event, page + 1);
    };

    const handleLastPageButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        onPageChange(event, Math.max(0, Math.ceil(count / rowsPerPage) - 1));
    };

    return (
        <Box sx={{ flexShrink: 0, ml: 2.5 }}>
            <IconButton
                onClick={handleFirstPageButtonClick}
                disabled={page === 0}
                aria-label="first page"
            >
                {theme.direction === 'rtl' ? <LastPageIcon /> : <FirstPageIcon />}
            </IconButton>
            <IconButton
                onClick={handleBackButtonClick}
                disabled={page === 0}
                aria-label="previous page"
            >
                {theme.direction === 'rtl' ? <KeyboardArrowRight /> : <KeyboardArrowLeft />}
            </IconButton>
            <IconButton
                onClick={handleNextButtonClick}
                disabled={page >= Math.ceil(count / rowsPerPage) - 1}
                aria-label="next page"
            >
                {theme.direction === 'rtl' ? <KeyboardArrowLeft /> : <KeyboardArrowRight />}
            </IconButton>
            <IconButton
                onClick={handleLastPageButtonClick}
                disabled={page >= Math.ceil(count / rowsPerPage) - 1}
                aria-label="last page"
            >
                {theme.direction === 'rtl' ? <FirstPageIcon /> : <LastPageIcon />}
            </IconButton>
        </Box>
    );
}

interface TableProps {
    rows: Employee[];
    info: (value: string) => void;
    error: (value: string) => void;
}

export default function Page({ rows, info, error }: TableProps) {
    const { t } = useTranslation('common')

    const [page, setPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);

    const [rowsData, setRows] = React.useState(rows);
    const [view, setView] = React.useState('hide'); // can be 'hide', 'add', 'edit', delete
    const [editItem, setEditItem] = React.useState<Employee | null>(null);

    React.useEffect(() => {
        setRows(rows);
    }, [rows]);

    // Avoid a layout jump when reaching the last page with empty rows.
    const emptyRows =
        page > 0 ? Math.max(0, (1 + page) * rowsPerPage - rowsData?.length) : 0;

    const handleChangePage = (
        event: React.MouseEvent<HTMLButtonElement> | null,
        newPage: number,
    ) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleBackClick = () => {
        setView('hide');
        setEditItem(null);
    };

    const handleSaveClick = (data: Employee) => {
        rowsData?.find(x => x.employee_id === data.employee_id) ?
            setRows(rowsData => rowsData?.map(x => x.employee_id === data.employee_id ? data : x))
            : setRows([...rowsData, data])
        setView('hide');
    };

    const handleAddClick = () => {
        setView('add');
    };

    const handleEditClick = (item: Employee) => {
        setEditItem(item);
        setView('edit');
    };

    const handleDeleteClick = (item: Employee) => {
        setEditItem(item);
        setView('delete');
    };

    const handleDeleteReq = (data: Employee) => {
        const index = rowsData?.indexOf(data)
        if (index !== -1) rowsData?.splice(index, 1);
        setRows(rowsData?.filter(row => row !== data))
    }

    const handleResetClick = (row: Employee) => {
        api.get(`/remove-password/${row?.employee_id}`)
            .then(res => {
                info(t('password_reset_success'))
            })
            .catch(error => {
                if (error.response && error.response.status === 422) {
                    // Validation error from server
                    console.log(error.response.data);
                    // setErrorMessage(error.response.data.message);
                    error(t('something_went_wrong'));
                } else {
                    // Other errors
                    console.error(t('unexpected_error'), error);
                    error(t('something_went_wrong'));
                }
            })
    }

    return (
        <TableContainer component={Paper}>
            <Table sx={{ tableLayout: 'fixed' }} aria-label="custom pagination table">
                <TableHead>
                    <TableRow>
                        <StyledTableCell>{t('name')}</StyledTableCell>
                        <StyledTableCell>{t('role')}</StyledTableCell>
                        <StyledTableCell align="right">{t('created_at')}</StyledTableCell>
                        <StyledTableCell sx={{ width: 200 }}>
                            <IconButton aria-label="add"
                                color="info"
                                onClick={handleAddClick}
                            >
                                <PersonAddIcon />
                            </IconButton>
                        </StyledTableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {view === 'add' && (
                        <AddPanel onBack={handleBackClick} onSave={handleSaveClick} />
                    )}
                    {(rowsPerPage > 0 && rowsData
                        ? rowsData?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        : rowsData
                    )?.map((row) => (
                        view === 'edit' && editItem?.employee_id === row?.employee_id ? (
                            <EditPanel
                                row={row}
                                onBack={handleBackClick}
                                onSave={handleSaveClick}
                            />
                        ) : view === 'delete' && editItem?.employee_id === row?.employee_id ? (
                            <DeletePanel
                                row={row}
                                onBack={handleBackClick}
                                onDelete={handleDeleteReq}
                            />
                        ) : (
                            <TableRow key={row?.employee_id}>
                                <TableCell component="th" scope="row">
                                    {row?.name}
                                </TableCell>
                                <TableCell style={{ width: 160 }}>
                                    {row?.role}
                                </TableCell>
                                <TableCell style={{ width: 160 }} align="right">
                                    {convertDateTime(row?.created_at)}
                                </TableCell>
                                <TableCell style={{ width: 160 }}>
                                    <IconButton
                                        aria-label="edit"
                                        color="primary"
                                        onClick={() => handleEditClick(row)}
                                        disabled={!row?.employee_id}
                                        sx={{ mr: 1 }}
                                    >
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton
                                        aria-label="reset"
                                        color="warning"
                                        onClick={() => handleResetClick(row)}
                                        disabled={!row?.employee_id}
                                        sx={{ mr: 1 }}
                                    >
                                        <LockResetIcon />
                                    </IconButton>
                                    <IconButton
                                        aria-label="delete"
                                        color="error"
                                        onClick={() => handleDeleteClick(row)}
                                        disabled={!row?.employee_id}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        )
                    ))}
                    {emptyRows > 0 && (
                        <TableRow style={{ height: 53 * emptyRows }}>
                            <TableCell colSpan={4} />
                        </TableRow>
                    )}
                </TableBody>
                <TableFooter>
                    <TableRow>
                        <TablePagination
                            rowsPerPageOptions={[5, 10, 25, { label: 'All', value: -1 }]}
                            colSpan={3}
                            count={rowsData?.length}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            slotProps={{
                                select: {
                                    inputProps: {
                                        'aria-label': t('rows_per_page'),
                                    },
                                    native: true,
                                },
                            }}
                            onPageChange={handleChangePage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                            ActionsComponent={TablePaginationActions}
                        />
                    </TableRow>
                </TableFooter>
            </Table>
        </TableContainer>
    );
}